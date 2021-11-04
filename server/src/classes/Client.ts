import {ServerChannel} from "@geckos.io/server";
import {OfflineStates, UnionToIntersection} from "../utils/types";
import randomWords from "@thorium/random-words";
import {DataContext} from "../utils/DataContext";
import inputs, {AllInputNames} from "../inputs";
import {
  cardSubscriptions,
  cardDataStreams,
  SubRecord,
  SubscriptionNames,
} from "client/src/utils/cardData";
import {pubsub} from "../utils/pubsub";
import {Entity} from "../utils/ecs";
import {SnapshotInterpolation} from "@geckos.io/snapshot-interpolation";
import {encode} from "@msgpack/msgpack";
import {SocketStream} from "fastify-websocket";
import requests, {AllRequestNames} from "../netRequests";
class BaseClient {
  constructor(public id: string) {}
}

type NetSendData = {inputName: AllInputNames; params: any; requestId: string};
type NetRequestData = {
  requestName: AllRequestNames;
  params: any;
  requestId: string;
};
const channels: Record<string, ServerChannel> = {};
const sockets: Record<string, SocketStream> = {};
/**
 * A client is a single computer running a Station. To run Thorium,
 * you must have at least one client for every Station in the simulation
 * (except the Captain), but you could have multiple clients running the
 * same Station on larger bridges. Each crew member (except the Captain)
 * should have at least one client computer.
 */
export class ServerClient extends BaseClient {
  name: string;
  connected: boolean;
  clientContext!: DataContext;
  subscriptionListeners: number[] = [];
  SI = new SnapshotInterpolation();

  constructor(params: {id: string} & Partial<ServerClient>) {
    super(params.id);
    this.name = params.name || randomWords(3).join("-");
    // The client starts disconnected since that's
    // how it will always be when the server starts up.
    this.connected = false;
  }
  public serialize() {
    const {clientContext, subscriptionListeners, SI, ...data} = this;
    return data;
  }
  public async initDataChannel(
    channel: ServerChannel,
    database: Pick<DataContext, "server" | "flight">
  ) {
    this.clientContext = new DataContext(this.id, database);
    channels[this.id] = channel;
    channel.onDisconnect(connectionState => {
      this.connected = false;
      for (let subId of this.subscriptionListeners) {
        pubsub.unsubscribe(subId);
      }
      pubsub.publish("clientList");
    });
  }
  public async initWebSocket(
    connection: SocketStream,
    database: Pick<DataContext, "server" | "flight">
  ) {
    this.clientContext = new DataContext(this.id, database);

    sockets[this.id] = connection;
    await this.initRequests(connection);
    await this.initSubscriptions(connection);
  }
  private async initRequests(socket: SocketStream) {
    if (!socket)
      throw new Error(
        "NetSend cannot be initialized before the socket is established."
      );
    const netRequestList: {
      [requestId: string]: {
        params: any;
        requestName: AllRequestNames;
        subscriptionId: number;
      };
    } = {};
    socket.socket.on("close", () => {
      for (let requestId in netRequestList) {
        pubsub.unsubscribe(netRequestList[requestId]?.subscriptionId);
      }
    });

    // Set up the whole netSend process for calling input functions
    socket.socket.on("message", async data => {
      try {
        const messageData = JSON.parse(data.toString());
        switch (messageData.type) {
          case "netSend": {
            const {inputName, params, requestId} =
              messageData.data as NetSendData;
            try {
              const inputFunction = inputs[inputName];
              const response =
                (await inputFunction(this.clientContext, params)) || {};

              // Send the result back to the client, regardless of what it is.
              socket.socket.send(
                JSON.stringify({
                  type: "netResponse",
                  data: {
                    requestId: requestId,
                    response,
                  },
                })
              );
            } catch (err) {
              let message = err;
              if (err instanceof Error) {
                message = err.message;
              }
              console.error(`Error in input ${inputName}: ${message}`);
              if (err instanceof Error) console.error(err.stack);
              socket.socket.send(
                JSON.stringify({
                  type: "netResponse",
                  data: {
                    requestId: requestId,
                    error: message,
                  },
                })
              );
            }
            break;
          }
          case "netRequest": {
            const {requestName, params, requestId} =
              messageData.data as NetRequestData;

            function handleNetRequestError(err: unknown) {
              if (err === null) return;
              let message = err;
              if (err instanceof Error) {
                message = err.message;
              }
              console.error(`Error in request ${requestName}: ${message}`);
              if (err instanceof Error) console.error(err.stack);
              socket.socket.send(
                JSON.stringify({
                  type: "netRequestData",
                  data: {
                    requestId: requestId,
                    error: message,
                  },
                })
              );
              pubsub.unsubscribe(netRequestList[requestId]?.subscriptionId);
              delete netRequestList[requestId];
            }

            try {
              const requestFunction = requests[requestName];
              // Create the subscription
              const subscriptionId = await pubsub.subscribe(
                requestName,
                (payload: any, context: DataContext) => {
                  try {
                    const data = requestFunction(context, params, payload);
                    socket.socket.send(
                      JSON.stringify({
                        type: "netRequestData",
                        data: {
                          requestId: requestId,
                          response: data,
                        },
                      })
                    );
                    return data;
                  } catch (err) {
                    handleNetRequestError(err);
                  }
                },
                this.clientContext
              );
              netRequestList[requestId] = {
                params,
                requestName,
                subscriptionId,
              };
              // Collect and send the initial data
              const response =
                (await requestFunction(this.clientContext, params, null)) || {};
              socket.socket.send(
                JSON.stringify({
                  type: "netRequestData",
                  data: {
                    requestId: requestId,
                    response,
                  },
                })
              );
            } catch (err) {
              if (err === null) {
                // Send null for the first request, to indicate there is no data
                socket.socket.send(
                  JSON.stringify({
                    type: "netRequestData",
                    data: {
                      requestId: requestId,
                      response: null,
                    },
                  })
                );
              } else {
                handleNetRequestError(err);
              }
            }
            break;
          }
          case "netRequestEnd": {
            const {requestId} = messageData.data as {requestId: string};
            pubsub.unsubscribe(netRequestList[requestId]?.subscriptionId);
            delete netRequestList[requestId];
            break;
          }
        }
      } catch (err) {
        throw new Error(
          `Client ${this.id} sent invalid request data:${
            typeof data === "object" ? JSON.stringify(data) : data
          }`
        );
      }
    });

    // Send a message to the client indicating that the connection is open
    socket.socket.send(
      JSON.stringify({
        type: "ready",
      })
    );
  }
  get cards() {
    // TODO Aug 28, 2021 Populate this list with the dynamic list of cards assigned to the client.
    // Also, there needs to be some way to unsubscribe and re-subscribe whenever the client's
    // ship, station, or cards change.
    const cards: (keyof typeof cardSubscriptions)[] = ["Clients", "Flights"];

    // This is required for the data that is passed to every connected client;
    cards.push("allData");

    return cards;
  }
  public async initSubscriptions(socket: SocketStream) {
    // Remove all of the existing subscriptions
    for (let subId of this.subscriptionListeners) {
      pubsub.unsubscribe(subId);
    }

    // All clients get the 'client' data, so automatically add it to the list
    const subscriptionList: {
      trigger: SubscriptionNames;
      listener: (payload: any, context: DataContext) => any;
    }[] = [];

    // Loop through all of the cards to generate the necessary subscription listeners
    for (let card of this.cards) {
      const cardSubs = cardSubscriptions[card] as UnionToIntersection<
        typeof cardSubscriptions[typeof card]
      >;
      const keys = Object.keys(cardSubs) as SubscriptionNames[];
      const initialData: Record<string, any> = {};
      for (let sub of keys) {
        // This listener will be called whenever `pubsub.publish(sub, payload)` is called.
        const listener = async (payload: any, context: DataContext) => {
          const subFunctions = cardSubs[sub] as SubRecord;
          if (
            subFunctions.filter &&
            !(await subFunctions.filter?.(payload, context))
          ) {
            return;
          }

          const data = await cardSubs[sub].fetch(context);
          // Send the data to the client, keyed by card
          socket.socket.send(
            JSON.stringify({
              type: "cardData",
              data: {card, data: {[sub]: data}},
            })
          );
        };
        initialData[sub] = await cardSubs[sub].fetch(this.clientContext);
        subscriptionList.push({trigger: sub, listener});
      }
      setTimeout(async () => {
        // Send initial data to the client. Need a delay for
        // the client to register.
        socket.socket.send(
          JSON.stringify({
            type: "cardData",
            data: {card, data: initialData},
          })
        );
      }, 100);
    }
    this.subscriptionListeners = await Promise.all(
      subscriptionList.map(async sub => {
        const subId = await pubsub.subscribe(
          sub.trigger,
          sub.listener,
          this.clientContext
        );
        return subId;
      })
    );
  }
  public async sendDataStream() {
    if (!this.clientContext.flight) return;
    const entities = this.clientContext.flight.ecs.entities
      .filter(entity => {
        for (let card of this.cards) {
          const cardStream = cardDataStreams[card] as (
            entity: Entity,
            context: DataContext
          ) => boolean;
          let includedInCard = cardStream?.(entity, this.clientContext);
          if (includedInCard) return true;
        }
        return false;
      })
      .map((e: Entity) => {
        // For snapshot interpolation, entities have to be flat, other than quaternions.
        // See https://github.com/geckosio/snapshot-interpolation#world-state
        // We're also removing any components of the entity that don't update
        // frequently to keep packet size down.
        return {
          id: e.id.toString(),
          ...e.components.position,
          rotation: e.components.rotation,
        };
      });
    const snapshot = this.SI.snapshot.create({entities});
    channels[this.id].raw.emit(encode(snapshot));
  }
}

/**
 * Properties which are associated between a flight and a client.
 * These properties are stored on the flight and then merged
 * back to the client when the flight is in progress.
 */
export class FlightClient extends BaseClient {
  flightId: string;
  shipId: string | null;
  stationId: string | null;
  loginName: string;
  offlineState: OfflineStates | null;
  training: boolean;
  constructor(params: {id: string} & Partial<FlightClient>) {
    super(params.id);
    if (!params.flightId)
      throw new Error("Error creating flight client: FlightID is required");
    this.flightId = params.flightId;
    this.shipId = params.shipId || null;
    this.stationId = params.stationId || null;
    this.loginName = params.loginName || "";
    this.offlineState = params.offlineState || null;
    this.training = params.training || false;
  }
  serialize() {
    return {
      id: this.id,
      flightId: this.flightId,
      shipId: this.shipId,
      stationId: this.stationId,
      loginName: this.loginName,
      offlineState: this.offlineState,
      training: this.training,
    };
  }
}

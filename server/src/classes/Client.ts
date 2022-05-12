import type {UnionToIntersection} from "../utils/types";
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
import {BaseClient} from "./BaseClient";
import {randomNameGenerator} from "../utils/randomNameGenerator";

type NetRequestData = {
  requestName: AllRequestNames;
  params: any;
  requestId: string;
};
type CardRequestData = {
  requestId: string;
  requestName: ["cardData", string];
};
const sockets: Record<string, SocketStream> = {};
/**
 * A client is a single computer running a Station. To run Thorium,
 * you must have at least one client for every Station in the simulation
 * (except the Captain), but you could have multiple clients running the
 * same Station on larger bridges. Each crew member (except the Captain)
 * should have at least one client computer.
 */

function socketSend(socket: SocketStream, data: any) {
  try {
    socket.socket.send(encode(data));
  } catch (err) {
    console.error(err);
    console.error(data);
  }
}
export class ServerClient extends BaseClient {
  name: string;
  isHost: boolean;
  connected: boolean;
  clientContext!: DataContext;
  SI = new SnapshotInterpolation();
  private _cards: (keyof typeof cardSubscriptions)[] | null = null;
  constructor(params: {id: string} & Partial<ServerClient>) {
    super(params.id);
    this.name = params.name || randomNameGenerator();
    // Host will always default to false, and will be set
    // to true when the host client connects to the server
    this.isHost = false;

    // The client starts disconnected since that's
    // how it will always be when the server starts up.
    this.connected = false;
  }
  public toJSON() {
    const {clientContext, SI, ...data} = this;
    return data;
  }
  public async initWebSocket(
    connection: SocketStream,
    database: Pick<DataContext, "server" | "flight">
  ) {
    this.clientContext = new DataContext(this.id, database);

    sockets[this.id] = connection;
    await this.initRequests(connection);
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
    const cardRequestList: {
      [requestId: string]: {
        requestName: ["cardData", string];
        subscriptionId: number;
      }[];
    } = {};

    socket.socket.on("close", () => {
      this.connected = false;
      pubsub.publish("thorium");
      pubsub.publish("client", {clientId: this.id});
      for (let requestId in netRequestList) {
        pubsub.unsubscribe(netRequestList[requestId]?.subscriptionId);
      }
      for (let requestId in cardRequestList) {
        for (let {subscriptionId} of cardRequestList[requestId]) {
          pubsub.unsubscribe(subscriptionId);
        }
      }
    });

    // Set up the whole netSend process for calling input functions
    socket.socket.on("message", async data => {
      try {
        const messageData = JSON.parse(data.toString());
        switch (messageData.type) {
          case "netRequest": {
            const {requestName, requestId} = messageData.data as
              | NetRequestData
              | CardRequestData;

            function handleNetRequestError(err: unknown) {
              if (err === null) return;
              let message = err;
              if (err instanceof Error) {
                message = err.message;
              }
              console.error(`Error in request ${requestName}: ${message}`);
              if (err instanceof Error) console.error(err.stack);
              socketSend(socket, {
                type: "netRequestData",
                data: {
                  requestId: requestId,
                  error: message,
                },
              });
              pubsub.unsubscribe(netRequestList[requestId]?.subscriptionId);
              delete netRequestList[requestId];
            }

            // If this client is already subscribed to this request, ignore the request.
            // It will already get the data it needs from the other request.
            if (netRequestList[requestId]) return;
            if (cardRequestList[requestId]) return;

            try {
              if (Array.isArray(requestName)) {
                // This is a card request
                const [, card] = requestName;
                const cardSubs = cardSubscriptions[card] as UnionToIntersection<
                  typeof cardSubscriptions[typeof card]
                >;
                if (!cardSubs) return;

                const keys = Object.keys(cardSubs) as SubscriptionNames[];
                const initialData: Record<string, any> = {};
                for (let sub of keys) {
                  // This listener will be called whenever `pubsub.publish(sub, payload)` is called.
                  const listener = async (
                    payload: any,
                    context: DataContext
                  ) => {
                    const subFunction = cardSubs[sub] as SubRecord;

                    try {
                      const data = await subFunction(context, payload);

                      // Send the data to the client, keyed by card
                      socketSend(socket, {
                        type: "cardData",
                        data: {card, data: {[sub]: data}},
                      });
                    } catch (err) {
                      if (err === null) return;
                      throw err;
                    }
                  };

                  initialData[sub] = await cardSubs[sub](this.clientContext);
                  const subscriptionId = await pubsub.subscribe(
                    sub,
                    // @ts-expect-error Promises are throwing this off, so we'll just ignore it.
                    listener,
                    this.clientContext
                  );
                  if (!cardRequestList[requestId])
                    cardRequestList[requestId] = [];

                  cardRequestList[requestId].push({
                    requestName,
                    subscriptionId,
                  });
                }
                setTimeout(async () => {
                  // Send initial data to the client. Need a delay for
                  // the client to register.
                  socketSend(socket, {
                    type: "cardData",
                    data: {card, data: initialData},
                  });
                }, 100);
              } else {
                const requestFunction = requests[requestName];
                const params = messageData.data.params || {};

                // Create the subscription
                async function handleRequest(
                  payload: any,
                  context: DataContext
                ) {
                  try {
                    const data = await requestFunction(
                      context,
                      params,
                      payload
                    );

                    socketSend(socket, {
                      type: "netRequestData",
                      data: {
                        requestId: requestId,
                        response: data,
                      },
                    });
                    return data as any;
                  } catch (err) {
                    handleNetRequestError(err);
                  }
                }
                const subscriptionId = await pubsub.subscribe(
                  requestName,
                  // @ts-expect-error Promises are throwing this off, so we'll just ignore it.
                  handleRequest,
                  this.clientContext
                );
                netRequestList[requestId] = {
                  params,
                  requestName,
                  subscriptionId,
                };
                // Collect and send the initial data
                const response =
                  (await requestFunction(this.clientContext, params, null!)) ||
                  {};

                socketSend(socket, {
                  type: "netRequestData",
                  data: {
                    requestId: requestId,
                    response,
                  },
                });
              }
            } catch (err) {
              if (err === null) {
                // Send null for the first request, to indicate there is no data
                socketSend(socket, {
                  type: "netRequestData",
                  data: {
                    requestId: requestId,
                    response: null,
                  },
                });
              } else {
                handleNetRequestError(err);
              }
            }
            break;
          }
          case "netRequestEnd": {
            const {requestId} = messageData.data as {requestId: string};
            if (netRequestList[requestId]) {
              pubsub.unsubscribe(netRequestList[requestId]?.subscriptionId);
            } else if (cardRequestList[requestId]) {
              for (let {subscriptionId} of cardRequestList[requestId]) {
                pubsub.unsubscribe(subscriptionId);
              }
            }
            delete netRequestList[requestId];
            delete cardRequestList[requestId];
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
    socketSend(socket, {
      type: "ready",
    });
  }
  get cards() {
    if (!this._cards) {
      this._cards =
        this.clientContext.ship?.components.stationComplement?.stations
          .find(s => s.name === this.clientContext.flightClient?.stationId)
          ?.cards.map(c => c.component) || [];
      this._cards = this._cards.concat(
        this.clientContext.flightClient?.stationOverride?.cards.map(
          c => c.component
        ) || []
      );
      // This is required for the data that is passed to every connected client;
      this._cards.push("allData");
    }

    return this._cards;
  }

  public async sendDataStream() {
    if (!this.clientContext?.flight) return;
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
    sockets[this.id].socket.send(encode(snapshot));
  }
}

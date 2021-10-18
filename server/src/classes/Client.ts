import {ServerChannel} from "@geckos.io/server";
import {OfflineStates, UnionToIntersection} from "../utils/types";
import uniqid from "@thorium/uniqid";
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
class BaseClient {
  constructor(public id: string) {}
}

type NetSendData = {inputName: AllInputNames; params: any; requestId: string};

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
    await this.initNetSend(connection);
    await this.initNetRequest(connection);
    await this.initSubscriptions(connection);
  }
  private async initNetSend(socket: SocketStream) {
    if (!socket)
      throw new Error(
        "NetSend cannot be initialized before the socket is established."
      );
    // Set up the whole netSend process for calling input functions
    socket.socket.on("message", async data => {
      try {
        if (typeof data === "string") {
          const messageData = JSON.parse(data);
          if (messageData.type === "netSend") {
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
          }
        }
      } catch (err) {
        throw new Error(
          `Client ${this.id} sent invalid NetSend data:${
            typeof data === "object" ? JSON.stringify(data) : data
          }`
        );
      }
      if (typeof data === "object" && "inputName" in data) {
      } else {
      }
    });
  }
  private async initNetRequest(channel: SocketStream) {
    // TODO: September 1, 2021 Set up net requests through the data channel
  }
  get cards() {
    // TODO Aug 28, 2021 Populate this list with the list of cards assigned to the client.
    // Also, there needs to be some way to unsubscribe and re-subscribe whenever the client's
    // ship, station, or cards change.
    const cards: (keyof typeof cardSubscriptions)[] = ["Clients", "Flights"];
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
        setTimeout(async () => {
          // Send initial data to the client. Need a delay for
          // the client to register.
          const data = await cardSubs[sub].fetch(this.clientContext);
          socket.socket.send(
            JSON.stringify({
              type: "cardData",
              data: {card, data: {[sub]: data}},
            })
          );
        }, 100);

        subscriptionList.push({trigger: sub, listener});
      }
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
}
import {SocketStream} from "@fastify/websocket";
import {Entity} from "@server/utils/ecs";
import {randomNameGenerator} from "@server/utils/randomNameGenerator";
import {ServerClient} from "@thorium/live-query/adapters/fastify-adapter";
import {inferAsyncReturnType} from "@thorium/live-query/server";
import {AnyRouter} from "@thorium/live-query/server/router";
import {FastifyRequest, FastifyReply} from "fastify";
import {DataContext} from "../utils/DataContext";
import {buildDatabase} from "./buildDatabase";
import {pubsub} from "./pubsub";

const dataContextCache = new Map<string, DataContext>();

export function getDataContext(id: string) {
  return dataContextCache.get(id) || null;
}
type ExtraContext = Awaited<ReturnType<typeof buildDatabase>>;
export function createContext({
  req,
  res,
  context,
}: {
  req: FastifyRequest;
  res: FastifyReply;
  context: ExtraContext;
}) {
  const id = req.headers["client-id"] as string;
  let dataContext = dataContextCache.get(id);
  if (!dataContext) {
    dataContext = new DataContext(id, context);
    dataContextCache.set(id, dataContext);
  }
  return dataContext;
}

export async function createWSContext({
  connection,
  context,
}: {
  connection: SocketStream;
  context: ExtraContext;
}) {
  const result = await Promise.race<string>([
    new Promise<string>(res => {
      const handleConnection = (data: any) => {
        const {type, ...message} = JSON.parse(data.toString());
        if (type === "clientConnect") {
          const id = message.id;
          res(id);
        }
      };
      connection.socket.on("message", handleConnection);
    }),
    new Promise((res, rej) =>
      setTimeout(() => rej(`Client Connect Timeout`), 60 * 1000)
    ),
  ]);
  let dataContext = dataContextCache.get(result);
  if (!dataContext) {
    dataContext = new DataContext(result, context);
    dataContextCache.set(result, dataContext);
  }
  const client = context.server.clients[result];
  client.initWebSocket(connection, dataContext);
  return dataContext;
}
export type Context = inferAsyncReturnType<typeof createContext>;
export class Client<TRouter extends AnyRouter> extends ServerClient<TRouter> {
  isHost: boolean = false;
  name: string = randomNameGenerator();

  public async sendDataStream(context: DataContext) {
    if (!context?.flight || !this.connected) return;
    const entities = context.flight.ecs.entities
      .filter((entity: Entity) => {
        for (const streamData of this.dataStreams.values()) {
          if (!this.router._def.procedures[streamData.path]?._def.dataStream)
            return false;
          const cardStream =
            this.router._def.procedures[streamData.path]?._def.resolver;
          let includeEntity = cardStream?.({
            entity,
            ctx: context,
            input: streamData.params,
          });
          if (includeEntity) return true;
        }
        return false;
      })
      .map((e: Entity) => {
        // For snapshot interpolation, entities have to be flat, other than quaternions.
        // See https://github.com/geckosio/snapshot-interpolation#world-state
        // We're also removing any components of the entity that don't update
        // frequently to keep packet size down.

        if (e.components.isWarpEngines) {
          return {
            id: e.id.toString(),
            x: e.components.isWarpEngines.forwardVelocity,
            y: e.components.isWarpEngines.maxVelocity,
          };
        }

        if (e.components.isImpulseEngines) {
          return {
            id: e.id.toString(),
            x: e.components.isImpulseEngines.forwardVelocity,
          };
        }

        const {parentId, type, ...position} = e.components.position || {};
        const shouldSnap = e.components.snapInterpolation ? 1 : 0;
        e.removeComponent("snapInterpolation");

        return {
          id: e.id.toString(),
          ...position,
          s: shouldSnap,
          r: e.components.rotation,
        };
      });
    const snapshot = this.SI.snapshot.create(entities);
    this.send(snapshot);
  }
  toJSON() {
    const {id, name, isHost} = this;
    return {id, name, isHost};
  }
  connectionOpened(): void {
    pubsub.publish.client.get({clientId: this.id});
    pubsub.publish.client.all();
  }
  connectionClosed(): void {
    pubsub.publish.client.get({clientId: this.id});
    pubsub.publish.client.all();
  }
}

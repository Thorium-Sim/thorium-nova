import type { Entity } from "@thorium/utils/ecs";
import { randomNameGenerator } from "@thorium/utils/operations/randomNameGenerator";
import type { inferAsyncReturnType } from "@thorium/utils/live-query/.server/index";
import type { AnyRouter } from "@thorium/utils/live-query/.server/router";
import { DataContext } from "../DataContext";
import type { buildDatabase } from "./buildDatabase";
import { pubsub } from "./pubsub";
import { dataStreamEntity } from "./dataStreamEntity";
import type { InitWebsocketParams } from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import { ServerClient } from "@thorium/utils/live-query/.server/ServerClient";
import { router } from "@thorium/.server/init/router";

const dataContextCache = new Map<string, DataContext>();

export function getDataContext(id: string) {
	return dataContextCache.get(id) || null;
}
type ExtraContext = Awaited<ReturnType<typeof buildDatabase>>;
export function createContext({
	clientId,
	context,
}: {
	clientId: string;
	context: ExtraContext;
}) {
	let dataContext = dataContextCache.get(clientId);
	if (!dataContext) {
		// Let's generate a client if it doesn't already exist in the database
		const client = context.server.clients[clientId];
		if (!client) {
			context.server.clients[clientId] = new Client(clientId, router, pubsub);
		}
		dataContext = new DataContext(clientId, context);
		dataContextCache.set(clientId, dataContext);
	}
	return dataContext;
}

export function initWebsocket({
	clientId,
	send,
	socketEmitter,
	context,
}: InitWebsocketParams<ExtraContext>) {
	const client = context.server.clients[clientId];
	client.initWebSocket(send, socketEmitter, context);
}

export type Context = inferAsyncReturnType<typeof createContext>;

export class Client<TRouter extends AnyRouter> extends ServerClient<TRouter> {
	isHost = false;
	name: string = randomNameGenerator();

	public async sendDataStream() {
		const context = getDataContext(this.id);

		if (!context?.flight || !this.connected) return;
		const entities = context.flight.ecs.entities
			.filter((entity: Entity) => {
				for (const streamData of this.dataStreams.values()) {
					if (!this.router._def.procedures[streamData.path]?._def.dataStream)
						return false;
					const cardStream =
						this.router._def.procedures[streamData.path]?._def.resolver;
					const includeEntity = cardStream?.({
						entity,
						ctx: context,
						input: streamData.params,
					});
					if (includeEntity) return true;
				}
				return false;
			})
			.map(dataStreamEntity);
		const snapshot = this.SI.snapshot.create(entities);
		this.send(snapshot);
	}
	toJSON() {
		const { id, name, isHost } = this;
		return { id, name, isHost };
	}
	connectionOpened(): void {
		// Claim host if there isn't one already claimed
		const ctx = getDataContext(this.id);
		if (ctx) {
			const hasHost = Object.values(ctx.server.clients).some(
				(client) => client.isHost && client.connected,
			);
			if (!hasHost) {
				this.isHost = true;
			}
		}
		pubsub.publish.client.get({ clientId: this.id });
		pubsub.publish.client.all();
		pubsub.publish.thorium.hasHost();
	}
	connectionClosed(): void {
		pubsub.publish.client.get({ clientId: this.id });
		pubsub.publish.client.all();
		if (this.isHost) {
			pubsub.publish.thorium.hasHost();
		}
	}
}

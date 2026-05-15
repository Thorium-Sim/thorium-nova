import type { ClientSettings } from "@thorium/.server/data";
import { router } from "@thorium/.server/init/router";
import { isDatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import type { Entity } from "@thorium/utils/ecs";
import type { inferAsyncReturnType } from "@thorium/utils/live-query/.server";
import type {
	CreateContextOpts,
	InitWebsocket,
	InitWebsocketParams,
} from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import { callProcedure, type AnyRouter } from "@thorium/utils/live-query/.server/router";
import { ServerClient } from "@thorium/utils/live-query/.server/ServerClient";
import { randomNameGenerator } from "@thorium/utils/operations/randomNameGenerator";

import { DataContext } from "../DataContext";
import { dataStreamEntity } from "./dataStreamEntity";
import { pubsub } from "./pubsub";

type InitWebsocketReturnType = ReturnType<InitWebsocket>;
const dataContextCache = new Map<string, DataContext>();

export function getDataContext(id: string) {
	return dataContextCache.get(id) || null;
}
export function createContext<TContext>({ clientId, context }: CreateContextOpts<TContext>) {
	let dataContext = dataContextCache.get(clientId);
	if (!dataContext) {
		if (!isDatabaseContext(context)) {
			throw new Error("Database context is required to create data context");
		} else {
			// Let's generate a client if it doesn't already exist in the database
			const client = context.server.clients[clientId];
			if (!client) {
				context.server.clients[clientId] = new Client(clientId, router, pubsub);
			}
			dataContext = new DataContext(clientId, context);
			dataContextCache.set(clientId, dataContext);
		}
	}
	return dataContext;
}

export function initWebsocket<TContext>({
	clientId,
	send,
	socketEmitter,
	extraContext,
}: InitWebsocketParams<TContext>): InitWebsocketReturnType {
	if (!isDatabaseContext(extraContext)) {
		throw new Error("Database context is required to initialize websocket");
	}
	const context = createContext({ clientId, context: extraContext });
	const client = context.server.clients[clientId];
	client.initWebSocket(send, socketEmitter, context).catch((err) => {
		throw new Error(err);
	});
	return { ...context, id: clientId };
}

export type Context = inferAsyncReturnType<typeof createContext>;

export class Client<TRouter extends AnyRouter> extends ServerClient<TRouter> {
	name: string = randomNameGenerator();
	settings: ClientSettings = {
		soundPlayer: true,
		ambiancePlayer: true,
		musicPlayer: true,
		dialoguePlayer: true,
	};
	public async sendDataStream() {
		const context = getDataContext(this.id);
		if (!context?.flight || !this.connected) return;
		/**
		 * All we care about are
		 * - The client's ship itself
		 * - Nearby ships
		 * - The ship's own systems
		 * - The ship's scans
		 * - Ship Passengers
		 */
		let entities = new Set<Entity>();
		for (const [, dataStream] of this.dataStreams) {
			const entitySet = await callProcedure({
				ctx: context,
				procedures: router._def.procedures,
				type: "dataStream",
				path: dataStream.path,
				rawInput: dataStream.params,
			});
			if (entitySet instanceof Set) {
				entities = entities.union(entitySet);
			}
		}
		let dataStream = [];
		for (const entity of entities) {
			dataStream.push(dataStreamEntity(entity));
		}

		const snapshot = this.SI.snapshot.create(dataStream);
		this.send(snapshot);
	}
	toJSON() {
		const { id, name, settings } = this;
		return { id, name, settings };
	}
	connectionOpened(): void {
		pubsub.publish.client.get({ clientId: this.id });
		pubsub.publish.client.all();
	}
	connectionClosed(): void {
		pubsub.publish.client.get({ clientId: this.id });
		pubsub.publish.client.all();
	}
}

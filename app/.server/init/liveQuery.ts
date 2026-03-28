import { isDatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import { randomNameGenerator } from "@thorium/utils/operations/randomNameGenerator";
import type { inferAsyncReturnType } from "@thorium/utils/live-query/.server";
import type { AnyRouter } from "@thorium/utils/live-query/.server/router";
import { DataContext } from "../DataContext";
import { pubsub } from "./pubsub";
import { dataStreamEntity } from "./dataStreamEntity";
import type {
	CreateContextOpts,
	InitWebsocket,
	InitWebsocketParams,
} from "@thorium/utils/live-query/.server/adapters/hono-adapter";
import { ServerClient } from "@thorium/utils/live-query/.server/ServerClient";
import { router } from "@thorium/.server/init/router";
import z from "zod";
import type { ClientSettings } from "@thorium/.server/data";

type InitWebsocketReturnType = ReturnType<InitWebsocket>;
const dataContextCache = new Map<string, DataContext>();

export function getDataContext(id: string) {
	return dataContextCache.get(id) || null;
}
export function createContext<TContext>({
	clientId,
	context,
}: CreateContextOpts<TContext>) {
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
		const entities = [];
		const ship = context.getPlayerShip(this.id);
		if (!ship) return;
		entities.push(dataStreamEntity(ship));

		for (const nearbyShipId of ship.components.nearbyObjects?.objects?.keys() ||
			[]) {
			const entity = context.ecs.getEntityById(nearbyShipId);
			if (entity) entities.push(dataStreamEntity(entity));
		}

		for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
			[]) {
			const entity = context.ecs.getEntityById(systemId);
			if (entity) entities.push(dataStreamEntity(entity));
		}

		for (const scanEntity of context.ecs.componentCache.get("scan") || []) {
			if (
				scanEntity.components.scan?.parentId === ship.id &&
				scanEntity.components.scan.progress < 1
			) {
				entities.push(dataStreamEntity(scanEntity));
			}
		}

		for (const diagnosticEntity of context.ecs.componentCache.get(
			"diagnostic",
		) || []) {
			if (
				diagnosticEntity.components.diagnostic?.shipId === ship.id &&
				diagnosticEntity.components.diagnostic.progress < 1
			) {
				entities.push(dataStreamEntity(diagnosticEntity));
			}
		}

		for (const torpedoEntity of context.ecs.componentCache.get("isTorpedo") ||
			[]) {
			if (
				torpedoEntity.components.position?.parentId ===
				ship.components.position?.parentId
			) {
				entities.push(dataStreamEntity(torpedoEntity));
			}
		}

		for (const legacySensorContact of context.ecs.componentCache.get(
			"isSensorContact",
		) || []) {
			if (
				legacySensorContact.components.isSensorContact?.shipId === ship.id &&
				!legacySensorContact.components.isArmyContact
			) {
				entities.push(dataStreamEntity(legacySensorContact));
			}
		}

		for (const passengerEntity of context.ecs.componentCache.get(
			"passengerMovement",
		) || []) {
			if (passengerEntity.components.position?.parentId === ship.id) {
				entities.push(dataStreamEntity(passengerEntity));
			}
		}

		const snapshot = this.SI.snapshot.create(entities);
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

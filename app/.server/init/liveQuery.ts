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

		for (const torpedoEntity of context.ecs.componentCache.get("isTorpedo") ||
			[]) {
			if (
				torpedoEntity.components.position?.parentId ===
				ship.components.position?.parentId
			) {
				entities.push(dataStreamEntity(torpedoEntity));
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

import type { DatabaseContext } from "@thorium/typeguards/isDatabaseContext";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { Entity } from "@thorium/utils/ecs";

import type { FlightDataModel } from "./classes/FlightDataModel";

/**
 * An instance of this class is available in every input and subscription handler
 * You can use getters to provide convenient computed data
 *
 * Be sure to update the docs page any time you modify the properties of this class
 */

export class DataContext {
	constructor(
		public clientId: string,
		public database: DatabaseContext,
		public localVariables?: Record<string, any>,
	) {}
	get server() {
		return this.database.server;
	}
	get flight() {
		return this.database.flight;
	}
	set flight(flight: FlightDataModel | null) {
		this.database.flight = flight;
	}
	get ecs() {
		return this.database.flight!.ecs;
	}
	readFile = DataStore.operations.getStore()!.readAsset;
	uploadFile = DataStore.operations.getStore()!.uploadAsset;
	removeFile = DataStore.operations.getStore()!.removeAsset;
	getPlayerShip(clientId: string) {
		return this.flight?.playerShips.find(
			(s) => s.id === this.getFlightClient(clientId)?.components.flightClient?.shipId,
		);
	}
	getClient(clientId: string) {
		return this.database.server.clients[clientId];
	}
	getFlightClient(clientId: string) {
		const serverClient = this.database.server.getClientByName(clientId);
		if (serverClient) {
			clientId = serverClient.id;
		}
		if (!this.database.flight) return null;
		if (!this.database.flight.flightClientIndex.has(clientId)) {
			for (const entity of this.ecs.componentCache.get("flightClient") || []) {
				if (entity.components.flightClient?.clientId === clientId) {
					this.database.flight.flightClientIndex.set(clientId, entity.id);
				}
			}
		}
		let flightClientEntity = this.ecs.getEntityById(
			this.database.flight.flightClientIndex.get(clientId) || -1,
		);

		if (!flightClientEntity) {
			flightClientEntity = new Entity();
			flightClientEntity.addComponent("flightClient", {
				clientId,
				flightId: this.database.flight.name,
			});
			this.ecs.addEntity(flightClientEntity);
		}
		return flightClientEntity!;
	}
}

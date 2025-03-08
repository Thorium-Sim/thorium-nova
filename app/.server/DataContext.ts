import { FlightClient } from "./classes/FlightClient";
import type { ServerDataModel } from "./classes/ServerDataModel";
import type { FlightDataModel } from "./classes/FlightDataModel";
import { DataStore } from "@thorium/utils/.server/db-fs";

/**
 * An instance of this class is available in every input and subscription handler
 * You can use getters to provide convenient computed data
 *
 * Be sure to update the docs page any time you modify the properties of this class
 */

export class DataContext {
	constructor(
		public clientId: string,
		public database: {
			server: ServerDataModel;
			flight: FlightDataModel | null;
		},
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
			(s) => s.id === this.getFlightClient(clientId)?.shipId,
		);
	}
	getClient(clientId: string) {
		return this.database.server.clients[clientId];
	}
	getIsHost(clientId: string) {
		return this.getClient(clientId).isHost;
	}
	getFlightClient(clientId: string) {
		if (!this.database.flight) return null;
		if (!this.database.flight.clients[clientId]) {
			this.database.flight.clients[clientId] = new FlightClient({
				id: clientId,
				flightId: this.database.flight.name,
			});
		}
		return this.database.flight.clients[clientId];
	}
}

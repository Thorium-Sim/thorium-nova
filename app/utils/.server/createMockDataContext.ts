import type { InventoryFlags } from "@thorium/utils/flags/InventoryFlags";
import { Client } from "@thorium/.server/init/liveQuery";
import { pubsub } from "@thorium/.server/init/pubsub";
import { router } from "@thorium/.server/init/router";
import { FlightClient } from "@thorium/.server/classes/FlightClient";
import type { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type BasePlugin from "@thorium/.server/classes/Plugins";
import ShipPlugin from "@thorium/.server/classes/Plugins/Ship";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import systems from "@thorium/.server/systems";
import type { DataContext } from "@thorium/.server/DataContext";
import { ECS, Entity } from "../ecs";
import { DataStore } from "@thorium/utils/.server/db-fs";
import { testDataStoreProps } from "@thorium/utils/.server/db-fs/testDataStoreProps";

class MockServerDataModel {
	clients!: Record<string, Client<any>>;
	thoriumId!: string;
	activeFlightName!: string | null;
	plugins = [
		{
			id: "Test Plugin",
			name: "Test Plugin",
			active: true,
			aspects: {
				shipSystems: [],
				ships: [
					new ShipPlugin({ name: "Test Template" }, {
						name: "Test Plugin",
						aspects: { ships: [] },
					} as unknown as BasePlugin),
				],
				solarSystems: [],
				inventory: [],
			},
		},
	];
	constructor() {
		this.clients = {
			test: new Client("test", router, pubsub),
		};
	}
	toJSON() {
		const { plugins, ...data } = this;
		return data;
	}
}
class MockFlightDataModel {
	static INTERVAL = 1000 / 60;
	id = "Test Flight";
	name = "Test Flight";
	date: number = Date.now();
	paused = false;
	ecs!: ECS;
	clients: Record<string, FlightClient> = {};
	pluginIds: string[] = [];
	private initEntities: Entity[] = [];
	serverDataModel: ServerDataModel;
	inventoryTemplates: {
		[key: string]: {
			name: string;
			volume: number;
			abundance: number;
			flags: InventoryFlags;
		};
	} = {};
	constructor(
		params: Partial<MockFlightDataModel> & {
			serverDataModel: ServerDataModel;
			initialLoad?: boolean;
			entities: Entity[];
		},
	) {
		this.serverDataModel = params.serverDataModel;
		this.initEntities = params.entities || [];
		this.clients = {
			test: new FlightClient({
				id: "test",
				flightId: this.id,
			}),
		};
	}
	run = () => {
		// Run all the systems
		if (!this.paused) {
			this.ecs.update();
		}
		if (process.env.NODE_ENV === "test") return;
		setTimeout(this.run, MockFlightDataModel.INTERVAL);
	};
	initEcs(server: ServerDataModel) {
		this.ecs = new ECS(server);
		systems.forEach((Sys) => {
			this.ecs.addSystem(new Sys());
		});
		this.initEntities.forEach(({ id, components }) => {
			const e = new Entity(id, components);
			this.ecs.addEntity(e);
		});
		this.run();
	}
	get playerShips() {
		return [...(this.ecs.componentCache.get("isPlayerShip") || [])];
	}
	get ships() {
		return [...(this.ecs.componentCache.get("isShip") || [])];
	}
	get availableShips() {
		const allShips = this.pluginIds.reduce((prev: ShipPlugin[], next) => {
			const plugin = this.serverDataModel.plugins.find(
				(plugin) => plugin.id === next,
			);
			if (!plugin) return prev;
			return prev.concat(plugin.aspects.ships);
		}, []);
		return allShips;
	}
	toJSON() {
		// Get all of the entities in the world and serialize them into objects
		return {
			id: this.id,
			name: this.name,
			paused: this.paused,
			date: this.date,
			pluginIds: this.pluginIds,
			entities: this.ecs.entities,
			flightClients: Object.fromEntries(
				Object.entries(this.clients).map(([id, client]) => [id, client]),
			),
		};
	}
}
class MockDataContext {
	clientId = "test" as const;
	database: { server: ServerDataModel; flight: FlightDataModel | null } = {
		server: new MockServerDataModel() as any as ServerDataModel,
		flight: null,
	};
	constructor() {
		this.database.flight = new MockFlightDataModel({
			serverDataModel: this.database.server,
			initialLoad: true,
			entities: [],
		}) as any as FlightDataModel;
		this.flight?.initEcs(this.server);
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
	get server() {
		return this.database.server;
	}
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
	uploadFile = async () => "";
	readFile = async () => "";
	removeFile = async () => {};
}

export function createMockDataContext() {
	return DataStore.operations.run(testDataStoreProps, () => {
		return new MockDataContext();
	});
}

export function createMockRouter(context: DataContext) {
	return DataStore.operations.run(testDataStoreProps, () => {
		return router.createCaller(context);
	});
}

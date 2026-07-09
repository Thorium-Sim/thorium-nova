import type { FlightDataModel } from "@thorium/.server/classes/FlightDataModel";
import type BasePlugin from "@thorium/.server/classes/Plugins";
import ShipPlugin from "@thorium/.server/classes/Plugins/Ship";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import type { DataContext } from "@thorium/.server/DataContext";
import { Client } from "@thorium/.server/init/liveQuery";
import { pubsub } from "@thorium/.server/init/pubsub";
import { router } from "@thorium/.server/init/router";
import { thoriumContext } from "@thorium/utils/.server/context";

import { ECS, Entity } from "../ecs";
import type { ProcedureCallOptions } from "../live-query/.server/procedure";

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
				ships: [],
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
	getClientByName(clientName: string) {
		for (const client in this.clients) {
			if (this.clients[client].name === clientName) return this.clients[client];
		}
		return null;
	}
	toJSON() {
		const { plugins: _, ...data } = this;
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
	pluginIds: string[] = [];
	private initEntities: Entity[] = [];
	serverDataModel: ServerDataModel;
	flightClientIndex = new Map();
	state!: "in-progress" | "success" | "failure";
	stateReason!: string;
	startInput!: { ships: any[]; missionId: any; startingPoint: any };
	mode!: "nova" | "legacy";

	constructor(
		params: Partial<MockFlightDataModel> & {
			serverDataModel: ServerDataModel;
			initialLoad?: boolean;
			entities: Entity[];
		},
	) {
		this.serverDataModel = params.serverDataModel;
		this.initEntities = params.entities || [];
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
		this.initEntities.forEach(({ id, components }) => {
			const e = new Entity(id, components);
			this.ecs.addEntity(e);
		});
		this.run();
	}
	setupEcsCallbacks() {}
	get playerShips() {
		return [...(this.ecs.componentCache.get("isPlayerShip") || [])];
	}
	get ships() {
		return [...(this.ecs.componentCache.get("isShip") || [])];
	}
	get availableShips() {
		const allShips = this.pluginIds.reduce((prev: ShipPlugin[], next) => {
			const plugin = this.serverDataModel.plugins.find((plugin) => plugin.id === next);
			if (!plugin) return prev;
			return prev.concat(plugin.aspects.ships);
		}, []);
		return allShips;
	}
	get clients() {
		const clients: Record<string, Entity> = {};
		for (const client of this.ecs.componentCache.get("flightClient") || []) {
			if (client.components.flightClient) {
				clients[client.components.flightClient.clientId] = client;
			}
		}
		return clients;
	}
	toJSON() {
		const entities = [];
		for (const [, entity] of this.ecs.entities) {
			entities.push(entity.toJSON());
		}
		// Get all of the entities in the world and serialize them into objects
		return {
			id: this.id,
			name: this.name,
			paused: this.paused,
			date: this.date,
			pluginIds: this.pluginIds,
			entities,
			maxEntityId: this.ecs.maxEntityId,
			rng: { seed: this.ecs.rng.seed, skip: this.ecs.rng.iterationCount },
			mode: this.mode,
			state: this.state,
			stateReason: this.stateReason,
			startInput: this.startInput,
		};
	}
	safeMode = false;
	get meta() {
		return {
			flightName: this.name,
			filePath: `/flights/${this.name}/data.yml`,
		};
	}
	initialData = {};
	write(force?: boolean, name?: string) {
		return thoriumContext.getStore()!.write.call(this, force, name);
	}
	getSnapshots() {
		return thoriumContext.getStore()!.getFlightSnapshots.call(this, this.name);
	}
	getAssetUrl = async () => "";
}
export class MockDataContext {
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
		void this.flight?.initEcs(this.server);
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
			(s) => s.id === this.getFlightClient(clientId)?.components.flightClient?.shipId,
		);
	}
	getClient(clientId: string) {
		return this.database.server.clients[clientId];
	}
	getFlightClient(clientId: string) {
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
	uploadFile = thoriumContext.getStore()!.uploadAsset;
	readFile = thoriumContext.getStore()!.readAsset;
	removeFile = thoriumContext.getStore()!.removeAsset;
}

export function createMockDataContext() {
	const dataContext = new MockDataContext();
	thoriumContext.getStore()!.database = dataContext.database;
	return dataContext;
}

export function createMockRouter(
	context: DataContext,
	opts: {
		onCall?: (opts: ProcedureCallOptions, result: unknown) => void | Promise<void>;
	} = {},
) {
	return router.createCaller(context, opts);
}

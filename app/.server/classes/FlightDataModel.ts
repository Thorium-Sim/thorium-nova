import path from "node:path";

import RAPIER from "@thorium-sim/rapier3d-node";
import { initECS } from "@thorium/.server/classes/initECS";
import { DataStore, type DataStoreOptions } from "@thorium/utils/.server/db-fs";
import { processTriggers } from "@thorium/utils/.server/evaluateEntityQuery";
import { executeBlocks } from "@thorium/utils/.server/executeBlocks";
import { loadGltf } from "@thorium/utils/.server/loadGltf";
import { ECS, Entity } from "@thorium/utils/ecs";
import randomWords from "@thorium/utils/random-words";
import { ConvexHull } from "@thorium/utils/starmap/ConvexHull.js";

import type ShipPlugin from "./Plugins/Ship";
import type { ServerDataModel } from "./ServerDataModel";

export class FlightDataModel extends DataStore {
	static INTERVAL = 1000 / 60;
	name!: string;
	date!: number;
	paused!: boolean;
	hasFlightDirector!: boolean;
	state!: "in-progress" | "success" | "failure";
	/** Why the flight was successful or failed */
	stateReason!: string;
	/** How long destroyed player ships must wait before respawning. Null means no respawns. */
	defaultRespawnTimeMs!: null | number;
	ecs!: ECS;
	pluginIds!: string[];
	private entities!: Entity[];
	serverDataModel: ServerDataModel;
	interval!: ReturnType<typeof setInterval>;
	startInput!: { ships: any[]; missionId: any; startingPoint: any };
	flightClientIndex: Map<string, number>;
	mode!: "nova" | "legacy";

	#getDataPromise: Promise<void>;
	constructor(
		params: Partial<FlightDataModel> & {
			serverDataModel: ServerDataModel;
			initialLoad?: boolean;
			entities: Entity[];
		},
		storeOptions: DataStoreOptions,
	) {
		const flightName = params.name || randomWords(3).join("-");

		super(
			{
				name: flightName,
				paused: false,
				date: Number(params.date ? new Date(params.date) : new Date()),
			},
			storeOptions,
		);
		this.flightClientIndex = new Map();
		this.serverDataModel = params.serverDataModel;

		this.#getDataPromise = this.getData<FlightDataModel>().then((data) => {
			this.name ??= flightName;
			this.paused ??= data.paused ?? true;
			this.mode ??= data.mode ?? params.mode ?? "nova";
			this.hasFlightDirector ??= data.hasFlightDirector ?? params.hasFlightDirector ?? true;
			this.date ??= Number(data.date ? new Date(data.date) : new Date());
			this.pluginIds ??= data.pluginIds || [];
			this.entities ??= data.entities || [];
			this.state = data.state || "in-progress";
			this.stateReason = data.stateReason || "";
			this.startInput = data.startInput || {};
		});
	}
	run = () => {
		// Run all the systems
		if (!this.paused) {
			this.ecs.update();
		}
		if (process.env.NODE_ENV === "test") return;
		this.interval = setTimeout(this.run, FlightDataModel.INTERVAL);
	};
	destroy() {
		clearInterval(this.interval);

		this.ecs.dispose();
		this.remove(true);
	}
	async initEcs(server: ServerDataModel) {
		await this.#getDataPromise;
		this.ecs = new ECS(server);
		initECS(this.ecs, this.entities, this.mode);
		this.ecs.processTriggers = (event) => processTriggers(this.ecs, event);
		this.ecs.executeBlocks = (blocks, metadata) => executeBlocks(this.ecs, blocks, metadata);
		if (!this.flightEntity) {
			const flight = new Entity();
			flight.addComponent("isFlight", {
				respawnTimeMs: this.defaultRespawnTimeMs,
			});
			this.ecs.addEntity(flight);
		}
		if (!this.interval) {
			this.run();
		}
	}
	async initPhysics() {
		// Fetch and calculate all of the colliders for the ships in the plugins
		// Loop over every ship in every loaded plugin
		const ships: ShipPlugin[] = [];
		for (const plugin of this.serverDataModel.plugins) {
			if (!this.pluginIds.includes(plugin.id)) continue;
			for (const ship of plugin.aspects.ships) {
				ships.push(ship);
			}
		}
		await Promise.all(
			ships.map(async (ship) => {
				if (!ship.assets.model) return;
				const assetUrl = path.join(await ship.getAssetUrl(), ship.assets.model);
				if (!assetUrl) return;
				const colliderDesc = await generateColliderDesc(assetUrl, ship.mass /*ship.length*/);
				if (!colliderDesc) return;
				this.ecs.colliderCache.set(ship.assets.model, colliderDesc);
			}),
		);
	}

	stop() {
		this.paused = true;
		clearTimeout(this.interval);
		this.ecs.dispose();
		this.flightClientIndex.clear();
	}

	// Helper Getters
	/**
	 * All player ships in the universe.
	 */
	get playerShips() {
		return [...(this.ecs.componentCache.get("isPlayerShip") || [])];
	}
	/**
	 * All ships in the universe.
	 */
	get ships() {
		return [...(this.ecs.componentCache.get("isShip") || [])];
	}
	async getSnapshots() {
		return DataStore.operations.getStore()!.getFlightSnapshots(this.name);
	}
	get flightEntity() {
		return this.ecs.componentCache.get("isFlight")?.values().next().value;
	}
	/**
	 * Ships that are available for spawning in the universe, based on the flight's plugins.
	 */
	get availableShips() {
		const allShips = this.pluginIds.reduce((prev: ShipPlugin[], next) => {
			const plugin = this.serverDataModel.plugins.find((plugin) => plugin.id === next);
			if (!plugin) return prev;
			return prev.concat(plugin.aspects.ships);
		}, []);
		return allShips;
	}
	get clients() {
		const clients: Record<string, Entity | undefined> = {};
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
		const data = {
			name: this.name,
			paused: this.paused,
			date: this.date,
			hasFlightDirector: this.hasFlightDirector,
			pluginIds: this.pluginIds,
			entities,
			rng: { seed: this.ecs.rng.seed, skip: this.ecs.rng.iterationCount },
			mode: this.mode,
			state: this.state,
			stateReason: this.stateReason,
			startInput: this.startInput,
			defaultRespawnTimeMs: this.defaultRespawnTimeMs,
			lastSaved: Date.now(),
		};
		return data;
	}
}

async function generateColliderDesc(
	filePath: string,
	mass: number,
	// size: number,
) {
	try {
		const hull = new ConvexHull();
		const gltf = await loadGltf(filePath);
		if (!gltf) {
			throw new Error("Failed to load gltf");
		}
		// This properly scales the collider to the size of the ship
		// gltf.scene.children[0].scale.multiplyScalar(size / 1000);

		hull.setFromObject(gltf.scene.children[0]);
		const vertices = [];
		for (const vertex of hull.vertices) {
			vertices.push(vertex.point.x, vertex.point.y, vertex.point.z);
		}
		const verticesFloat32 = new Float32Array(vertices);
		const colliderDesc = RAPIER.ColliderDesc.convexHull(verticesFloat32)?.setMass(mass);

		return colliderDesc;
	} catch (err) {
		console.error("Failed to generate convex hulls for", filePath);
		console.error(err);
		return null;
	}
}

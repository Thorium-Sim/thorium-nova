import { ECS, Entity } from "@thorium/utils/ecs";
import randomWords from "@thorium/utils/random-words";
import type { ServerDataModel } from "./ServerDataModel";
import systems from "@thorium/.server/systems";
import { FlightClient } from "./FlightClient";
import { DataStore, type DataStoreOptions } from "@thorium/utils/.server/db-fs";
import type ShipPlugin from "./Plugins/Ship";
import { DefaultUIDGenerator } from "@thorium/utils/ecs/uid";
import { loadGltf } from "@thorium/utils/.server/loadGltf";
import RAPIER from "@thorium-sim/rapier3d-node";
import path from "node:path";

export class FlightDataModel extends DataStore {
	static INTERVAL = 1000 / 60;
	name!: string;
	date!: number;
	paused!: boolean;
	ecs!: ECS;
	clients!: Record<string, FlightClient>;
	pluginIds!: string[];
	private entities!: Entity[];
	serverDataModel: ServerDataModel;
	interval!: ReturnType<typeof setInterval>;
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
		this.serverDataModel = params.serverDataModel;
		this.#getDataPromise = this.getData<FlightDataModel>().then((data) => {
			this.name ??= flightName;
			this.paused ??= data.paused ?? true;
			this.date ??= Number(data.date ? new Date(data.date) : new Date());
			this.pluginIds ??= data.pluginIds || [];
			this.entities ??= data.entities || [];

			this.clients = Object.fromEntries(
				Object.entries(this.clients || data.clients || {}).map(
					([id, client]) => [id, new FlightClient(client)],
				),
			);
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

		this.ecs.entities.forEach((entity) => {
			entity.dispose();
		});
		this.remove(true);
	}
	async initEcs(server: ServerDataModel) {
		await this.#getDataPromise;
		this.ecs = new ECS(server);
		systems.forEach((Sys) => {
			this.ecs.addSystem(new Sys());
		});
		// We need to selectively add certain entities first
		this.entities.forEach(({ id, components }) => {
			if (components.isSolarSystem) {
				const e = new Entity(id, components);
				this.ecs.addEntity(e);
			}
		});
		this.entities.forEach(({ id, components }) => {
			if (components.isSolarSystem) return;
			const e = new Entity(id, components);
			this.ecs.addEntity(e);
		});
		const maxId = this.entities.reduce(
			(acc, { id }) => Math.max(acc, id),
			DefaultUIDGenerator.uid,
		);
		DefaultUIDGenerator.uid = maxId + 1;
		this.run();
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
				const colliderDesc = await generateColliderDesc(
					assetUrl,
					ship.mass,
					ship.length,
				);
				if (!colliderDesc) return;
				this.ecs.colliderCache.set(ship.assets.model, colliderDesc);
			}),
		);
	}

	reset() {
		// TODO: Flight Reset Handling
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
	/**
	 * Ships that are available for spawning in the universe, based on the flight's plugins.
	 */
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
		const entities = [];
		for (const [, entity] of this.ecs.entities) {
			entities.push(entity.toJSON());
		}
		// Get all of the entities in the world and serialize them into objects
		const data = {
			name: this.name,
			paused: this.paused,
			date: this.date,
			pluginIds: this.pluginIds,
			entities,
			maxEntityId: this.ecs.maxEntityId,
			clients: Object.fromEntries(
				Object.entries(this.clients).map(([id, client]) => [id, client]),
			),
		};
		return data;
	}
}

async function generateColliderDesc(
	filePath: string,
	mass: number,
	size: number,
) {
	try {
		const ConvexHull = await import("three-stdlib").then(
			(res) => (res as any).ConvexHull,
		);
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
		const colliderDesc =
			RAPIER.ColliderDesc.convexHull(verticesFloat32)?.setMass(mass);

		return colliderDesc;
	} catch (err) {
		console.error("Failed to generate convex hulls for", filePath);
		console.error(err);
		return null;
	}
}

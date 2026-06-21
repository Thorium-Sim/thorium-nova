/**
 * Entity Component System module
 */

import type { ColliderDesc, World } from "@thorium-sim/rapier3d-node";
import RAPIER from "@thorium-sim/rapier3d-node";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";
import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import type { ComponentIds } from "@thorium/ecs-components";
import type { BlockMetadata } from "@thorium/utils/.server/executeBlocks";
import { type RNG, createRNG } from "@thorium/utils/rng";

import type Entity from "./entity";
import performance from "./performance";
import type System from "./system";

class ECS {
	/**
	 * Store all entities of the ECS.
	 */
	entities = new Map<number, Entity>();
	/**
	 * Store entities which need to be tested at beginning of next tick.
	 */
	entitiesSystemsDirty = new Set<Entity>();
	/**
	 * Store all systems of the ECS.
	 */
	systems = new Set<System>();
	/**
	 * Count how many updates have been done.
	 */
	updateCounter = 0;
	lastUpdate = this.now();
	rng: RNG;
	maxEntityId = 1;
	componentCache = new Map<ComponentIds, Set<Entity>>();
	colliderCache = new Map<string, ColliderDesc>();
	shipSystemCache = new Map<string, Entity | Entity[]>();
	changeBatch = new Set<`${number}-${ComponentIds}`>();
	// The key is the sector number based on the location of this physics world
	worlds = new Map<string, World>();

	constructor(
		public server: ServerDataModel,
		seed: string | number = "thorium",
		skip?: number,
	) {
		this.rng = createRNG(seed, skip);
	}
	/**
	 * Retrieve an entity by id
	 */
	getEntityById(id: number) {
		return this.entities.get(id) || null;
	}
	/**
	 * Add an entity to the ecs.
	 */
	addEntity(entity: Entity) {
		this.entities.set(entity.id, entity);
		entity.addToECS(this);
		this.maxEntityId = Math.max(this.maxEntityId, entity.id);
		Object.keys(entity.components).forEach((componentName) => {
			this.batchChange(entity.id, componentName as ComponentIds);
		});
	}
	/**
	 * Remove an entity from the ecs by reference.
	 */
	removeEntity(entity: Entity) {
		const hasEntity = this.entities.has(entity.id);
		// if the entity is not found, do nothing
		if (hasEntity) {
			entity.dispose();
			this.removeEntityIfDirty(entity);
			this.entities.delete(entity.id);
		}

		Object.keys(entity.components).forEach((componentName) => {
			const componentCache = this.componentCache.get(componentName as ComponentIds);
			if (!componentCache) return;
			componentCache.forEach((e) => {
				if (e.id === entity.id) {
					componentCache.delete(e);
				}
			});
			this.batchChange(entity.id, componentName as ComponentIds);
		});
		return entity;
	}
	/**
	 * Remove an entity from the ecs by entity id.
	 */
	removeEntityById(entityId: number) {
		const entity = this.entities.get(entityId);
		if (entity) {
			this.removeEntity(entity);
			return entity;
		}
		return null;
	}
	/**
	 * Remove an entity from dirty entities by reference.
	 */
	removeEntityIfDirty(entity: Entity) {
		this.entitiesSystemsDirty.delete(entity);
	}
	/**
	 * Add a system to the ecs.
	 */
	addSystem(system: System) {
		system.ecs = this;
		this.systems.add(system);
		system.attach();

		// iterate over all entities to eventually add system
		for (const [, entity] of this.entities) {
			if (system.test(entity)) {
				system.addEntity(entity);
			}
		}
	}
	/**
	 * Remove a system from the ecs.
	 */
	removeSystem(system: System) {
		this.systems.delete(system);
		system.dispose();
	}
	/**
	 * "Clean" entities flagged as dirty by removing unnecessary systems and
	 * adding missing systems.
	 */
	cleanDirtyEntities() {
		for (const entity of this.entitiesSystemsDirty) {
			for (const system of this.systems) {
				// for each dirty entity for each system
				const entityHasSystem = entity.systems.has(system);
				const entityTest = system.test(entity);

				if (!entityHasSystem && entityTest) {
					// if the entity is not added to the system yet and should be, add it
					system.addEntity(entity);
				} else if (entityHasSystem && !entityTest) {
					// if the entity is added to the system but should not be, remove it
					system.removeEntity(entity);
				}
				// else we do nothing the current state is OK
			}

			entity.systemsDirty = false;
		}

		this.entitiesSystemsDirty.clear();
	}
	now() {
		if (typeof Bun === "undefined") {
			return performance.now();
		}
		// Convert nanoseconds to milliseconds
		return Bun.nanoseconds() / 1_000_000;
	}
	/**
	 * Update the ecs.
	 *
	 * @method update
	 */
	update(testElapsed?: number) {
		const now = this.now();
		const elapsed = testElapsed ?? now - this.lastUpdate;
		if (this.entitiesSystemsDirty.size > 0) {
			this.cleanDirtyEntities();
		}
		for (const system of this.systems) {
			if (this.entitiesSystemsDirty.size > 0) {
				// if the last system flagged some entities as dirty check that case
				this.cleanDirtyEntities();
			}
			system.updateAll(elapsed, this.updateCounter);
		}
		this.updateCounter += 1;
		this.lastUpdate = now;
	}
	batchChange(entityId: number, component: ComponentIds) {
		this.changeBatch.add(`${entityId}-${component}`);
	}
	dispose() {
		for (const sys of this.systems) {
			this.removeSystem(sys);
		}
		for (const [, entity] of this.entities) {
			this.removeEntity(entity);
		}
		this.colliderCache.clear();
		this.componentCache.clear();
		this.shipSystemCache.clear();
		this.changeBatch.clear();
	}
	getWorld(key: string) {
		if (!this.worlds.has(key)) {
			this.worlds.set(key, new RAPIER.World({ x: 0, y: 0, z: 0 }));
		}
		return this.worlds.get(key)!;
	}
	// oxlint-disable-next-line no-unused-vars
	executeBlocks(blocks: TimelineBlock[], blocksMetadata: BlockMetadata = {}) {
		// We have to keep this blank and register it when we init ECS
		// to prevent weird dependency loops when executing blocks from
		// ECS systems
		throw new Error("executeBlocks has not been properly registered. Have you run initEcs yet?");
	}
	// oxlint-disable-next-line no-unused-vars
	processTriggers(event?: { event: string; values: any }) {
		// We have to keep this blank and register it when we init ECS
		// to prevent weird dependency loops when executing blocks from
		// ECS systems
		throw new Error("processTriggers has not been properly registered. Have you run initEcs yet?");
	}
}

export default ECS;

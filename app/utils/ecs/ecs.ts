/**
 * Entity Component System module
 */

import type Entity from "./entity";
import type System from "./system";
import performance from "./performance";
import { fastSplice } from "./utils";
import { type RNG, createRNG } from "@thorium/utils/rng";
import type { ColliderDesc } from "@thorium-sim/rapier3d-node";
import type { ComponentIds } from "@thorium/ecs-components";
import type { ServerDataModel } from "@thorium/.server/classes/ServerDataModel";

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
	lastUpdate = performance.now();
	rng: RNG;
	maxEntityId = 1;
	componentCache: Map<ComponentIds, Set<Entity>> = new Map();
	colliderCache: Map<string, ColliderDesc> = new Map();
	shipSystemCache = new Map<string, Entity>();

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
	}
	/**
	 * Remove an entity from the ecs by reference.
	 */
	removeEntity(entity: Entity) {
		const hasEntity = this.entities.has(entity.id);
		// if the entity is not found do nothing
		if (hasEntity) {
			entity.dispose();
			this.removeEntityIfDirty(entity);
			this.entities.delete(entity.id);
		}

		Object.keys(entity.components).forEach((componentName) => {
			const componentCache = this.componentCache.get(
				componentName as ComponentIds,
			);
			if (!componentCache) return;
			componentCache.forEach((e) => {
				if (e.id === entity.id) {
					componentCache.delete(e);
				}
			});
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
	/**
	 * Update the ecs.
	 *
	 * @method update
	 */
	update(testElapsed?: number) {
		const now = performance.now();
		const elapsed = testElapsed ?? now - this.lastUpdate;
		if (this.entitiesSystemsDirty.size > 0) {
			this.cleanDirtyEntities();
		}
		for (const system of this.systems) {
			if (this.updateCounter % system.frequency > 0) {
				continue;
			}
			if (this.entitiesSystemsDirty.size > 0) {
				// if the last system flagged some entities as dirty check that case
				this.cleanDirtyEntities();
			}
			system.updateAll(elapsed);
		}
		this.updateCounter += 1;
		this.lastUpdate = now;
	}
}

export default ECS;

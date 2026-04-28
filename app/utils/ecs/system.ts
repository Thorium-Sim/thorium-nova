import type ECS from "./ecs";
import type Entity from "./entity";

/**
 * @description  A system update all eligible entities at a given frequency.
 * This class is not meant to be used directly and should be sub-classed to
 * define specific logic.
 */
class System {
	/**
	 * Frequency of update execution, a frequency of `1` run the system every
	 * update, `2` will run the system every 2 updates, ect.
	 */
	frequency: number;

	/**
	 * For frequency > 1, we need to accumulate the elapsed time
	 */
	elapsedAccumulation = 0;

	ecs!: ECS;
	/**
	 * Entities of the system.
	 */
	entities = new Map<number, Entity>();
	/**
	 * The amount of time per frame in milliseconds which this system
	 * is allowed to run. Any entities it doesn't process will
	 * be processed the following frame.
	 */
	budgetMs: number | null = null;

	static flightMode: string[];

	/**
	 * Entities that were deferred for a future frame
	 */
	constructor(frequency = 1) {
		this.frequency = frequency;
	}
	/**
	 * Add an entity to the system entities.
	 */
	addEntity(entity: Entity) {
		entity.addSystem(this);
		this.entities.set(entity.id, entity);

		this.enter(entity);
	}

	/**
	 * Remove an entity from the system entities. exit() handler is executed
	 * only if the entity actually exists in the system entities.
	 *
	 * @param  {Entity} entity Reference of the entity to remove.
	 */
	removeEntity(entity: Entity) {
		if (this.entities.has(entity.id)) {
			entity.removeSystem(this);
			this.entities.delete(entity.id);

			this.exit(entity);
		}
	}
	/**
	 * Apply update to each entity of this system.
	 */
	updateAll(elapsed: number, updateCounter: number) {
		if (updateCounter % this.frequency > 0) {
			this.elapsedAccumulation += elapsed;
			return;
		}

		this.preUpdate(elapsed + this.elapsedAccumulation);

		for (const [_, entity] of this.entities) {
			this.update(entity, elapsed + this.elapsedAccumulation);
		}

		this.postUpdate(elapsed + this.elapsedAccumulation);

		this.elapsedAccumulation = 0;
	}
	/**
	 * dispose the system by exiting all the entities
	 */
	dispose() {
		for (const [_, entity] of this.entities) {
			entity.removeSystem(this);
			this.exit(entity);
		}
	}
	// methods to be extended by subclasses
	/**
	 * Called when the system is attached to an ECS instance
	 */
	attach() {}
	/**
	 * Abstract method to subclass. Called once per update, before entities
	 * iteration.
	 */
	preUpdate(_elapsed: number) {}
	/**
	 * Abstract method to subclass. Called once per update, after entities
	 * iteration. Use this to publish any relevant updates.
	 */
	postUpdate(_elapsed: number) {}
	/**
	 * Abstract method to subclass. Should return true if the entity is eligible
	 * to the system, false otherwise.
	 */
	test(_entity: Entity): boolean {
		return false;
	}
	/**
	 * Abstract method to subclass. Called when an entity is added to the system.
	 */
	enter(_entity: Entity) {}
	/**
	 * Abstract method to subclass. Called when an entity is removed from the system.
	 */
	exit(_entity: Entity) {}
	/**
	 * Abstract method to subclass. Called for each entity to update. This is
	 * the only method that should actual mutate entity state.
	 */
	update(_entity: Entity, _elapsedMs: number) {}
}
// jshint unused:true

export default System;

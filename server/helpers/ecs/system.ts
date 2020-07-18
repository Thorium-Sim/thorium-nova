import Entity from "./entity";

import {fastSplice} from "./utils";

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
   * Entities of the system.
   */
  entities: Entity[] = [];
  constructor(frequency: number = 1) {
    this.frequency = frequency;
  }
  /**
   * Add an entity to the system entities.
   */
  addEntity(entity: Entity) {
    entity.addSystem(this);
    this.entities.push(entity);

    this.enter(entity);
  }
  /**
   * Remove an entity from the system entities. exit() handler is executed
   * only if the entity actually exists in the system entities.
   *
   * @param  {Entity} entity Reference of the entity to remove.
   */
  removeEntity(entity: Entity) {
    let index = this.entities.indexOf(entity);

    if (index !== -1) {
      entity.removeSystem(this);
      fastSplice(this.entities, index, 1);

      this.exit(entity);
    }
  }
  /**
   * Apply update to each entity of this system.
   */
  updateAll(elapsed: number) {
    this.preUpdate();

    for (let i = 0, entity; (entity = this.entities[i]); i += 1) {
      this.update(entity, elapsed);
    }

    this.postUpdate();
  }
  /**
   * dispose the system by exiting all the entities
   */
  dispose() {
    for (let i = 0, entity; (entity = this.entities[i]); i += 1) {
      entity.removeSystem(this);
      this.exit(entity);
    }
  }
  // methods to be extended by subclasses
  /**
   * Abstract method to subclass. Called once per update, before entities
   * iteration.
   */
  preUpdate() {}
  /**
   * Abstract method to subclass. Called once per update, after entities
   * iteration.
   */
  postUpdate() {}
  /**
   * Abstract method to subclass. Should return true if the entity is eligible
   * to the system, false otherwise.
   */
  test(entity: Entity) {
    return false;
  }
  /**
   * Abstract method to subclass. Called when an entity is added to the system.
   */
  enter(entity: Entity) {}
  /**
   * Abstract method to subclass. Called when an entity is removed from the system.
   */
  exit(entity: Entity) {}
  /**
   * Abstract method to subclass. Called for each entity to update. This is
   * the only method that should actual mutate entity state.
   */
  update(entity: Entity, elapsed: number) {}
}
// jshint unused:true

export default System;

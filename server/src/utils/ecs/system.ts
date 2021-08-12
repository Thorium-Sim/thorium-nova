import {Component, ComponentId} from "./component";
import ECS from "./ecs";
import Entity from "./entity";
import {ComponentProperties as Components} from "../../components";

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

  ecs!: ECS;
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
    let index = this.entities.findIndex(e => e.id === entity.id);
    if (index !== -1) {
      entity.removeSystem(this);
      fastSplice(this.entities, index, 1);

      this.exit(entity);
    }
  }
  /**
   * Apply update to each entity of this system.
   */
  updateAll(elapsed: number = 1) {
    this.preUpdate(elapsed);

    for (let i = 0, entity; (entity = this.entities[i]); i += 1) {
      this.update(entity, elapsed);
    }

    this.postUpdate(elapsed);
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
  test(_entity: Entity) {
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

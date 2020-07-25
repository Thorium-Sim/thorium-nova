/**
 * Entity Component System module
 */

import Entity from "./entity";
import System from "./system";
import performance from "./performance";
import {fastSplice} from "./utils";

class ECS {
  /**
   * Store all entities of the ECS.
   */
  entities: Entity[] = [];
  /**
   * Store entities which need to be tested at beginning of next tick.
   */
  entitiesSystemsDirty: Entity[] = [];
  /**
   * Store all systems of the ECS.
   */
  systems: System[] = [];
  /**
   * Count how many updates have been done.
   */
  updateCounter = 0;
  lastUpdate = performance.now();

  /**
   * Retrieve an entity by id
   */
  getEntityById(id: string) {
    for (let i = 0, entity; (entity = this.entities[i]); i += 1) {
      if (entity.id === id) {
        return entity;
      }
    }

    return null;
  }
  /**
   * Add an entity to the ecs.
   */
  addEntity(entity: Entity) {
    this.entities.push(entity);
    entity.addToECS(this);
  }
  /**
   * Remove an entity from the ecs by reference.
   */
  removeEntity(entity: Entity) {
    let index = this.entities.findIndex(e => e.id === entity.id);
    let entityRemoved = null;
    // if the entity is not found do nothing
    if (index !== -1) {
      entityRemoved = this.entities[index];

      entity.dispose();
      this.removeEntityIfDirty(entityRemoved);

      fastSplice(this.entities, index, 1);
    }

    return entityRemoved;
  }
  /**
   * Remove an entity from the ecs by entity id.
   */
  removeEntityById(entityId: string) {
    for (let i = 0, entity; (entity = this.entities[i]); i += 1) {
      if (entity.id === entityId) {
        entity.dispose();
        this.removeEntity(entity);

        fastSplice(this.entities, i, 1);

        return entity;
      }
    }
  }
  /**
   * Remove an entity from dirty entities by reference.
   */
  removeEntityIfDirty(entity: Entity) {
    let index = this.entitiesSystemsDirty.indexOf(entity);

    if (index !== -1) {
      fastSplice(this.entities, index, 1);
    }
  }
  /**
   * Add a system to the ecs.
   */
  addSystem(system: System) {
    system.ecs = this;
    this.systems.push(system);

    // iterate over all entities to eventually add system
    for (let i = 0, entity; (entity = this.entities[i]); i += 1) {
      if (system.test(entity)) {
        system.addEntity(entity);
      }
    }
  }
  /**
   * Remove a system from the ecs.
   */
  removeSystem(system: System) {
    let index = this.systems.indexOf(system);

    if (index !== -1) {
      fastSplice(this.systems, index, 1);
      system.dispose();
    }
  }
  /**
   * "Clean" entities flagged as dirty by removing unecessary systems and
   * adding missing systems.
   */
  cleanDirtyEntities() {
    for (let i = 0, entity; (entity = this.entitiesSystemsDirty[i]); i += 1) {
      for (let s = 0, system; (system = this.systems[s]); s += 1) {
        // for each dirty entity for each system
        let index = entity.systems.indexOf(system);
        let entityTest = system.test(entity);

        if (index === -1 && entityTest) {
          // if the entity is not added to the system yet and should be, add it
          system.addEntity(entity);
        } else if (index !== -1 && !entityTest) {
          // if the entity is added to the system but should not be, remove it
          system.removeEntity(entity);
        }
        // else we do nothing the current state is OK
      }

      entity.systemsDirty = false;
    }

    this.entitiesSystemsDirty = [];
  }
  /**
   * Update the ecs.
   *
   * @method update
   */
  update() {
    let now = performance.now();
    let elapsed = now - this.lastUpdate;

    for (let i = 0, system; (system = this.systems[i]); i += 1) {
      if (this.updateCounter % system.frequency > 0) {
        break;
      }

      if (this.entitiesSystemsDirty.length) {
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

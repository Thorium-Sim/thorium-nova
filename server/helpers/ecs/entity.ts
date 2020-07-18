/**
 * @module  ecs
 */

import {fastSplice} from "./utils";
import uniqid from "uniqid";
import System from "./system";
import {ECS} from "./ecs";
import {Field, ID, ObjectType} from "type-graphql";

export type ComponentOmit<T> = Omit<T, "name" | "defaults" | "getDefaults">;

abstract class Component {
  static id: string;
  static defaults: any;
  static getDefaults?: Function;
}

@ObjectType()
export class TimerComponent extends Component {
  static id: "timer" = "timer";
  static defaults: ComponentOmit<TimerComponent> = {
    label: "Generic",
    time: "00:05:00",
    paused: false,
  };

  @Field()
  label!: string;

  @Field()
  time: string = "00:00:00";

  @Field()
  paused: boolean = false;
}
console.log(TimerComponent);

@ObjectType()
class Components {
  [name: string]: Record<string, any> | undefined;
  @Field()
  timer?: TimerComponent;
}

/**
 * An entity.
 */
@ObjectType()
class Entity {
  @Field(type => ID)
  id: string;
  systems: System[];
  systemsDirty: boolean;
  @Field()
  components: Components;
  ecs: ECS | null;
  constructor(id: string | null, components: Component[] = []) {
    /**
     * Unique identifier of the entity.
     */
    this.id = id || uniqid();

    /**
     * Systems applied to the entity.
     */
    this.systems = [];

    /**
     * Indicate a change in components (a component was removed or added)
     * which require to re-compute entity eligibility to all systems.
     */
    this.systemsDirty = false;

    /**
     * Components of the entity stored as key-value pairs.
     */
    this.components = {};

    // components initialization
    for (let i = 0, component; (component = components[i]); i += 1) {
      // if a getDefaults method is provided, use it. First because let the
      // runtime allocate the component is way more faster than using a copy
      // function. Secondly because the user may want to provide some kind
      // of logic in components initialization ALTHOUGH these kind of
      // initialization should be done in enter() handler
      // @ts-ignore ts(2576) // Accessing static properties
      console.log(component);
      // @ts-ignore ts(2576) // Accessing static properties
      if (component.getDefaults) {
        // @ts-ignore ts(2576)
        this.components[component.id] = component.getDefaults();
      } else {
        // @ts-ignore ts(2576)
        this.components[component.id] = {...components[i].defaults};
      }
    }

    /**
     * A reference to parent ECS class.
     */
    this.ecs = null;
  }
  /**
   * Set the parent ecs reference.
   *
   * @private
   * @param {ECS} ecs An ECS class instance.
   */
  addToECS(ecs: ECS) {
    this.ecs = ecs;
    this.setSystemsDirty();
  }
  /**
   * Set the systems dirty flag so the ECS knows this entity
   * needs to recompute eligibility at the beginning of next
   * tick.
   */
  setSystemsDirty() {
    if (!this.systemsDirty && this.ecs) {
      this.systemsDirty = true;

      // notify to parent ECS that this entity needs to be tested next tick
      this.ecs.entitiesSystemsDirty.push(this);
    }
  }
  /**
   * Add a system to the entity.
   */
  addSystem(system: System) {
    this.systems.push(system);
  }
  /**
   * Remove a system from the entity.
   */
  removeSystem(system: System) {
    let index = this.systems.indexOf(system);

    if (index !== -1) {
      fastSplice(this.systems, index, 1);
    }
  }
  /**
   * Add a component to the entity. WARNING this method does not copy
   * components data but assign directly the reference for maximum
   * performances. Be sure not to pass the same component reference to
   * many entities.
   */
  addComponent(name: string, data: Object) {
    this.components[name] = data || {};
    this.setSystemsDirty();
  }
  /**
   * Remove a component from the entity. To preserve performances, we
   * simple set the component property to `undefined`. Therefore the
   * property is still enumerable after a call to removeComponent()
   */
  removeComponent(name: string) {
    if (!this.components[name]) {
      return;
    }

    this.components[name] = undefined;
    this.setSystemsDirty();
  }
  /**
   * Update a component field by field, NOT recursively. If the component
   * does not exists, this method create it silently.
   * @example
   *   entity.addComponent('kite', {vel: 0, pos: {x: 1}});
   *   // entity.component.pos is '{vel: 0, pos: {x: 1}}'
   *   entity.updateComponent('kite', {angle: 90, pos: {y: 1}});
   *   // entity.component.pos is '{vel: 0, angle: 90, pos: {y: 1}}'
   */
  updateComponent(name: string, data: Record<string, any>) {
    let component = this.components[name];

    if (!component) {
      this.addComponent(name, data);
    } else {
      let keys = Object.keys(data);

      for (let i = 0, key; (key = keys[i]); i += 1) {
        component[key] = data[key];
      }
    }
  }
  /**
   * Update a set of components.
   */
  updateComponents(componentsData: Record<string, Record<string, any>>) {
    let components = Object.keys(componentsData);

    for (let i = 0, component; (component = components[i]); i += 1) {
      this.updateComponent(component, componentsData[component]);
    }
  }
  /**
   * Dispose the entity.
   */
  dispose() {
    for (var i = 0, system; (system = this.systems[0]); i += 1) {
      system.removeEntity(this);
    }
  }
}

export default Entity;

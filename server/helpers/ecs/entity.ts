import {fastSplice} from "./utils";
import uniqid from "uniqid";
import System from "./system";
import ECS from "./ecs";
import {Field, ID, ObjectType} from "type-graphql";
import Components, {registeredComponents} from "../../components";
import {Component} from "../../components/utils";

function isEntity(e: any): e is Entity {
  if (typeof e !== "object" || e === null) return false;
  if (e.id && e.components && e.systems) return true;
  return false;
}
function isClass(v: any) {
  return typeof v === "function" && /^\s*class\s+/.test(v.toString());
}

// This proxy handler makes it so component values can be accessed directly from the
// entity. It does not (yet?) allow for component values to be updated on the entity
// except through reference.
const handler: ProxyHandler<Entity> = {
  get(target, key) {
    // @ts-ignore
    if (target[key]) return target[key];
    // @ts-ignore
    if (target.components[key]) return target.components[key];
    if (key === "isProxy") return true;
    return undefined;
  },
};

/**
 * An entity.
 */
@ObjectType()
class Entity extends Components {
  @Field(type => ID)
  id: string;
  @Field()
  pluginId!: string;
  @Field()
  pluginName!: string;
  systems: System[];
  systemsDirty: boolean;
  @Field()
  components: Components;
  private ecs: ECS | null;
  constructor(
    id?: Partial<Entity> | string | null,
    components: Component[] = []
  ) {
    super();

    let initialData: Components = {};
    if (isEntity(id)) {
      /**
       * A reference to the original plugin, used for getting assets
       */
      this.pluginId = id.pluginId;

      initialData = id.components;
      components = registeredComponents.reduce(
        (list: Component[], component) => {
          if (initialData[component.id]) {
            return list.concat(component);
          }
          return list;
        },
        []
      );
      const componentIds = components.map((c: any) => c.id);
      const missingFields = Object.keys(initialData).filter(
        c => !componentIds.includes(c)
      );
      if (missingFields.length > 0) {
        console.warn(
          `\nRegistered Components is missing some components: ${missingFields.join(
            ", "
          )}`
        );
      }
      id = id.id;
    }
    /**
     * Unique identifier of the entity.
     */
    this.id = (id as string | null) || uniqid();

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
    for (let i = 0, component: Component; (component = components[i]); i += 1) {
      if (!component) continue;
      let data = {};
      // if a getDefaults method is provided, use it. First because let the
      // runtime allocate the component is way more faster than using a copy
      // function. Secondly because the user may want to provide some kind
      // of logic in components initialization ALTHOUGH these kind of
      // initialization should be done in enter() handler
      // @ts-ignore ts(2576) // Accessing static properties      // @ts-ignore ts(2576) // Accessing static properties
      if (initialData[component.id]) {
        // @ts-ignore ts(2576) // Accessing static properties
        data = initialData[component.id];
      }
      // @ts-ignore ts(2576)
      else if (component.getDefaults) {
        // @ts-ignore ts(2576)
        data = component.getDefaults();
      } else {
        // @ts-ignore ts(2576)
        data = {
          // @ts-ignore ts(2576)
          ...components[i].defaults,
        };
      }

      // @ts-ignore ts(2576)
      this.components[component.id] = data;
    }

    /**
     * A reference to parent ECS class.
     */
    this.ecs = null;

    return new Proxy(this, handler);
  }
  serialize() {
    return {
      id: this.id,
      pluginId: this.pluginId,
      components: Object.fromEntries(
        Object.entries(this.components).map(([key, value]) => {
          const updatedValue = {...value};
          const excludeFields =
            registeredComponents.find(c => c.id === key)?.excludeFields || [];
          if (excludeFields) {
            excludeFields.forEach((field: string) => {
              delete updatedValue[field];
            });
          }

          return [key, updatedValue];
        })
      ),
      systems: [],
    };
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
  addComponent(name: keyof Components, data?: any) {
    this.components[name] = data || {};
    this.setSystemsDirty();
  }
  /**
   * Remove a component from the entity. To preserve performances, we
   * simple set the component property to `undefined`. Therefore the
   * property is still enumerable after a call to removeComponent()
   */
  removeComponent(name: keyof Components) {
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
  updateComponent(
    name: keyof Components,
    data: Partial<Components[typeof name]>
  ) {
    let component = this.components[name];
    if (!data) return;
    if (!component) {
      this.addComponent(name, data);
    } else {
      let keys = Object.keys(data);

      for (let i = 0, key; (key = keys[i]); i += 1) {
        // @ts-ignore
        component[key] = data[key];
      }
    }
  }
  /**
   * Update a set of components.
   */
  updateComponents(componentsData: Record<string, Record<string, any>>) {
    let components = Object.keys(componentsData);

    for (
      let i = 0, component;
      (component = components[i] as keyof Components);
      i += 1
    ) {
      // @ts-ignore
      this.updateComponent(component, componentsData[component]);
    }
  }
  /**
   * Dispose the entity.
   */
  dispose() {
    this.systems.forEach(s => {
      s.removeEntity(this);
    });
  }
}

export default Entity;

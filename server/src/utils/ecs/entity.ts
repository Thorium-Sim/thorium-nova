/**
 * @module  ecs
 */

import type ECS from "./ecs";
import type System from "./system";
import { UIDGenerator, DefaultUIDGenerator } from "./uid";
import { fastSplice } from "./utils";
import {
	type ComponentProperties as Components,
	type ComponentIds,
	components as allComponents,
	type ComponentInputs,
} from "../../components";

type DeepPartial<T> = Partial<{
	[P in keyof T]: Partial<T[P]>;
}>;
/**
 * An entity.
 *
 * @class  Entity
 */
class Entity {
	/**
	 * @class Entity
	 * @constructor
	 *
	 * @param  {Number|UIDGenerator} [idOrUidGenerator=null] The entity id if
	 * a Number is passed. If an UIDGenerator is passed, the entity will use
	 * it to generate a new id. If nothing is passed, the entity will use
	 * the default UIDGenerator.
	 *
	 * @param {Array[Component]} [components=[]] An array of initial components.
	 */
	id: number;
	ecs: null | ECS;
	systems: System[];
	systemsDirty: boolean;
	components: Partial<Components>;
	constructor(
		idOrUidGenerator?: number | UIDGenerator | null,
		components: DeepPartial<Components> = {} as Components,
	) {
		/**
		 * Unique identifier of the entity.
		 *
		 * @property {Number} id
		 */
		this.id = -1;

		// initialize id depending on what is the first argument
		if (typeof idOrUidGenerator === "number") {
			// if a number was passed then simply set it as id
			this.id = idOrUidGenerator;
		} else if (idOrUidGenerator instanceof UIDGenerator) {
			// if an instance of UIDGenerator was passed then use it to generate
			// the id. This allow the user to use multiple UID generators and
			// therefore to create entities with unique ids across a cluster
			// or an async environment. See uid.js for more details
			this.id = idOrUidGenerator.next();
		} else {
			// if nothing was passed simply use the default generator
			this.id = DefaultUIDGenerator.next();
		}
		/**
		 * Systems applied to the entity.
		 *
		 * @property {Array[System]} systems
		 */
		this.systems = [];
		/**
		 * Indicate a change in components (a component was removed or added)
		 * which require to re-compute entity eligibility to all systems.
		 *
		 * @property {Boolean} systemsDirty
		 */
		this.systemsDirty = false;
		/**
		 * Components of the entity stored as key-value pairs.
		 *
		 * @property {Object} components
		 */
		this.components = {} as Components;
		// components initialization
		for (const componentId in components) {
			// Initialize with a function. First because it lets the
			// runtime allocate the component is way more faster than using a copy
			// function. Secondly because the user may want to provide some kind
			// of logic in components initialization ALTHOUGH these kind of
			// initialization should be done in enter() handler
			const component = allComponents[componentId as ComponentIds];
			const data = components[componentId as ComponentIds];
			try {
				this.components[componentId as ComponentIds] = component.parse(
					data,
				) as any;
			} catch (err) {
				console.error("Error initializing component:", componentId, err);
			}
		}
		/**
		 * A reference to parent ECS class.
		 * @property {ECS} ecs
		 */
		this.ecs = null;
	}
	toJSON() {
		return {
			id: this.id,
			components: Object.fromEntries(
				Object.entries(this.components).map(([key, comp]) => {
					if (comp && "shipSystems" in comp && key === "shipSystems") {
						return [
							key,
							{ ...comp, shipSystems: Array.from(comp.shipSystems.entries()) },
						];
					}
					if (comp && "world" in comp && key === "physicsWorld") {
						return [key, { ...comp, world: null }];
					}
					if (key === "physicsHandles") {
						return [key, { handles: new Map() }];
					}
					if (key === "nearbyObjects") {
						return [key, { objects: new Map() }];
					}
					return [key, comp];
				}),
			),
		} as Pick<Entity, "id" | "components">;
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
		this.setComponentCache();
	}
	setComponentCache() {
		Object.keys(this.components).forEach((componentName) => {
			this.addComponentCache(componentName as keyof Components);
		});
	}
	addComponentCache(componentName: keyof Components) {
		let componentCache = this.ecs?.componentCache.get(componentName);
		if (!componentCache) {
			componentCache = new Set();
			this.ecs?.componentCache.set(componentName, componentCache);
		}
		componentCache.add(this);
	}
	removeComponentCache(componentName: keyof Components) {
		const componentCache = this.ecs?.componentCache.get(componentName);
		if (!componentCache) return;
		componentCache.delete(this);
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
	 *
	 * @private
	 * @param {System} system The system to add.
	 */
	addSystem(system: System) {
		this.systems.push(system);
	}
	/**
	 * Remove a system from the entity.
	 *
	 * @private
	 * @param  {System} system The system reference to remove.
	 */
	removeSystem(system: System) {
		const index = this.systems.indexOf(system);

		if (index !== -1) {
			fastSplice(this.systems, index, 1);
		}
	}
	/**
	 * Add a component to the entity. WARNING this method does not copy
	 * components data but assign directly the reference for maximum
	 * performances. Be sure not to pass the same component reference to
	 * many entities.
	 *
	 * @param {String} name Attribute name of the component to add.
	 * @param {Object} data Component data.
	 */
	async addComponent<
		Name extends keyof Components,
		Data extends Components[Name],
	>(name: Name, data: Partial<Data> = {}) {
		const component = allComponents[name as ComponentIds];
		try {
			const componentData = component.parse(data) as Data;
			this.components[name] = componentData;
		} catch (err) {
			console.error("Error initializing component:", name, data, err);
		}
		this.addComponentCache(name);
		this.setSystemsDirty();
	}
	/**
	 * Remove a component from the entity. To preserve performances, we
	 * simple set the component property to `undefined`. Therefore the
	 * property is still enumerable after a call to removeComponent()
	 *
	 * @param  {String} name Name of the component to remove.
	 */
	removeComponent(name: keyof Components) {
		if (!this.components[name]) {
			return;
		}

		delete this.components[name];
		this.setSystemsDirty();
		this.removeComponentCache(name);
	}
	/**
	 * Update a component field by field, NOT recursively. If the component
	 * does not exists, this method create it silently.
	 *
	 * @method updateComponent
	 * @param  {String} name Name of the component
	 * @param  {Object} data Dict of attributes to update
	 * @example
	 *   entity.addComponent('kite', {vel: 0, pos: {x: 1}});
	 *   // entity.component.pos is '{vel: 0, pos: {x: 1}}'
	 *   entity.updateComponent('kite', {angle: 90, pos: {y: 1}});
	 *   // entity.component.pos is '{vel: 0, angle: 90, pos: {y: 1}}'
	 */
	updateComponent<Name extends keyof Components, Data extends Components[Name]>(
		name: Name,
		data: Partial<Data>,
	) {
		const component = this.components[name];

		if (!component) {
			this.addComponent(name, data);
		} else {
			Object.assign(component, data);
		}
	}
	/**
	 * Update a set of components.
	 *
	 * @param  {Object} componentsData Dict of components to update.
	 */
	updateComponents<K extends keyof ComponentInputs>(
		componentsData: Partial<ComponentInputs>,
	) {
		const components = Object.keys(componentsData) as K[];

		// biome-ignore lint/suspicious/noAssignInExpressions:
		for (let i = 0, component: K; (component = components[i] as K); i += 1) {
			this.updateComponent(component, (componentsData[component] || {}) as any);
		}
	}
	/**
	 * Dispose the entity.
	 *
	 * @private
	 */
	dispose() {
		while (this.systems.length > 0) {
			this.systems[0].removeEntity(this);
			fastSplice(this.systems, 0, 1);
		}
	}
}

export default Entity;

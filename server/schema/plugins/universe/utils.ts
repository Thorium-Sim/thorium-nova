import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import {Field, ObjectType} from "type-graphql";
import BasePlugin from "../basePlugin";

export function publishPluginUniverse(plugin: BasePlugin) {
  pubsub.publish("pluginUniverse", {
    id: plugin.id,
    universe: plugin.universe,
  });
}
export function getPlugin(id: string) {
  const plugin = App.plugins.find(u => u.id === id);
  if (!plugin) {
    throw new Error("Unable to find that plugin.");
  }
  return plugin;
}

@ObjectType()
export class PlanetarySystem extends Entity {
  pluginId!: string;

  @Field(type => [Entity], {
    description: "The objects that inhabit this system",
  })
  items: Entity[] = [];

  constructor(params: Partial<PlanetarySystem> & {pluginId: string}) {
    super(params);
    this.pluginId = params.pluginId;
  }
}

export function getSystem(
  id: string,
  systemId: string,
  optimizePlugin?: BasePlugin
) {
  const plugin = optimizePlugin || getPlugin(id);
  const system = plugin.universe.find(s => s.id === systemId);
  if (!system) {
    throw new Error("System does not exist");
  }
  return {
    plugin,
    system: new PlanetarySystem({...system, pluginId: id}),
  };
}

export function getSystemObject(id: string, objectId: string) {
  const plugin = getPlugin(id);
  const object = plugin.universe.find(s => s.id === objectId);
  if (!object) {
    throw new Error("Object does not exist");
  }

  if (!object.satellite?.parentId) {
    throw new Error("System does not exist");
  }
  const {system} = getSystem(id, object.satellite.parentId, plugin);

  return {plugin, object, system};
}

// Astronomical units in KM
export const AU = 149597870;

export function removeUniverseObject(plugin: BasePlugin, objectId: string) {
  // Remove any other object inside this object.
  plugin.universe.forEach(o => {
    if (o.satellite?.parentId === objectId) {
      removeUniverseObject(plugin, o.id);
    }
  });
  for (let i = plugin.universe.length - 1; i >= 0; i--) {
    if (plugin.universe[i].id === objectId) {
      plugin.universe.splice(i, 1);
    }
  }
}

export function objectPublish(
  plugin: BasePlugin,
  object: Entity,
  system?: Entity
) {
  publishPluginUniverse(plugin);
  if (system) {
    pubsub.publish("pluginUniverseSystem", {id: system.id, system});
  }
  pubsub.publish("pluginUniverseObject", {
    id: object.id,
    pluginId: plugin.id,
    object,
  });
  return object;
}

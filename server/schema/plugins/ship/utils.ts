import App from "server/app";
import Components from "server/components";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import BasePlugin, {getPlugin, publish} from "../basePlugin";

export function getShip(options: {pluginId?: string; shipId: string}) {
  const {pluginId, shipId} = options;
  let ship: Entity | undefined;
  let plugin: BasePlugin | undefined;
  if (pluginId) {
    plugin = getPlugin(pluginId);
    ship = plugin.ships.find(o => o.id === shipId);
  } else if (shipId) {
    ship = App.activeFlight?.ships.find(s => s.id === shipId);
  } else {
    throw new Error(
      "Cannot query for ship. Either 'shipId' or both 'pluginId' are required."
    );
  }
  if (!ship) throw new Error("Cannot find ship.");
  return {plugin, ship};
}

export function shipPublish({
  plugin,
  ship,
}: {
  plugin?: BasePlugin;
  ship: Entity;
}) {
  if (plugin) {
    publish(plugin);
    pubsub.publish("pluginShips", {
      pluginId: plugin.id,
      ships: plugin.ships,
    });
    pubsub.publish("pluginShip", {
      pluginId: plugin.id,
      shipId: ship.id,
      ship,
    });
  }
  // TODO: Add mid-flight subscription update.
}

export function updateShip({
  pluginId,
  shipId,
  componentType,
  update,
}: {
  pluginId?: string;
  outfitId?: string;
  shipId: string;
  componentType: keyof Components;
  update: Partial<Components[typeof componentType]>;
}) {
  const {ship, plugin} = getShip({
    pluginId,
    shipId,
  });
  ship.updateComponent(componentType, update);
  shipPublish({plugin, ship});
  return ship;
}

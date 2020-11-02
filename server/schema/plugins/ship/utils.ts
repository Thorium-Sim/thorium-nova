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
  }

  if (!ship) {
    ship = App.plugins.reduce((prev: Entity | undefined, next) => {
      if (prev) return prev;
      const ship = next.ships.find(s => s.id === shipId);
      if (ship) {
        ship.pluginId = next.id;
        return ship;
      }
      return undefined;
    }, undefined);
  }
  if (!ship) throw new Error("Cannot find ship.");
  return {plugin, ship};
}

export function shipPublish({
  plugin,
  ship,
  // Detailed represents minute details that don't matter to other ships
  detailed,
}: {
  plugin?: BasePlugin;
  ship: Entity;
  detailed?: boolean;
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
  } else if (App.activeFlight) {
    // Subscription for ships in the same solar system.
    if (!detailed) {
      const systemId = ship.interstellarPosition?.systemId;
      console.log("publishing");
      pubsub.publish("universeSystemShips", {
        systemId,
        ships: App.activeFlight.ecs.entities.filter(
          s => s.isShip && s.interstellarPosition?.systemId === systemId
        ),
      });
    }
    // TODO: Add mid-flight subscription update.
    // TODO: Add subscription for player simulators
  }
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

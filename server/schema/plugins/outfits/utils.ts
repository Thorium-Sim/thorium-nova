import App from "server/app";
import Components from "server/components";
import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import BasePlugin, {getPlugin, publish} from "../basePlugin";

export function getOutfit(options: {
  pluginId?: string;
  outfitId?: string;
  shipId?: string;
  outfitType?: keyof Entity;
}) {
  const {pluginId, outfitId, shipId, outfitType} = options;
  let outfit: Entity | undefined;
  let ship: Entity | undefined;
  let plugin: BasePlugin | undefined;
  if (pluginId && outfitId) {
    plugin = getPlugin(pluginId);
    outfit = plugin.outfits.find(o => o.id === outfitId);
  } else if (pluginId && !outfitId) {
    throw new Error("Cannot query for outfit. 'outfitId' is required.");
  } else if (outfitId && !pluginId) {
    throw new Error("Cannot query for outfit. 'pluginId' is required.");
  } else if (shipId && outfitType) {
    ship = App.activeFlight?.ships.find(s => s.id === shipId);
    outfit = App.activeFlight?.ecs.entities.find(
      e => e[outfitType] && e.shipAssignment?.shipId === shipId
    );
  } else {
    throw new Error(
      "Cannot query for outfit. Both 'shipId' and 'outfitType' or both 'outfitId' and 'pluginId' are required."
    );
  }
  if (!outfit) throw new Error("Cannot find outfit.");
  return {plugin, ship, outfit};
}

export function outfitPublish({
  plugin,
  ship,
  outfit,
}: {
  plugin?: BasePlugin;
  ship?: Entity;
  outfit: Entity;
}) {
  if (plugin) {
    publish(plugin);
    pubsub.publish("pluginOutfits", {
      pluginId: plugin.id,
      outfits: plugin.outfits,
    });
    pubsub.publish("pluginOutfit", {
      pluginId: plugin.id,
      id: outfit.id,
      outfit: outfit,
    });
  }
  pubsub.publish(`${outfit.isOutfit?.outfitType}Outfit`, {
    outfit,
    pluginId: plugin?.id,
    outfitId: outfit.id,
    shipId: ship?.id,
  });
}

export function updateOutfit({
  pluginId,
  outfitId,
  shipId,
  outfitType,
  update,
}: {
  pluginId?: string;
  outfitId?: string;
  shipId?: string;
  outfitType: keyof Components;
  update: Partial<Components[typeof outfitType]>;
}) {
  const {outfit, ship, plugin} = getOutfit({
    pluginId,
    outfitId,
    shipId,
    outfitType,
  });
  outfit.updateComponent(outfitType, update);
  outfitPublish({plugin, ship, outfit});
  return outfit;
}

export function getAnyOutfit(outfitId: string) {
  return App.plugins.reduce((acc: Entity[], p) => {
    const outfit = p.outfits.find(o => o.id === outfitId);
    if (outfit) {
      acc.push(outfit);
    }
    return acc;
  }, [])[0];
}

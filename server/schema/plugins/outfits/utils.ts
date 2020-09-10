import Entity from "server/helpers/ecs/entity";
import {pubsub} from "server/helpers/pubsub";
import BasePlugin, {getPlugin, publish} from "../basePlugin";

export function getOutfit(pluginId: string, outfitId: string) {
  const plugin = getPlugin(pluginId);
  const outfit = plugin.outfits.find(s => s.id === outfitId);
  if (!outfit) {
    throw new Error("Outfit does not exist in this plugin.");
  }
  return {plugin, outfit};
}

export function outfitPublish({
  plugin,
  outfit,
}: {
  plugin: BasePlugin;
  outfit: Entity;
}) {
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

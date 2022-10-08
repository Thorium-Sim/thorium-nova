import {DataContext} from "server/src/utils/DataContext";
import {getPlugin} from "./utils";

export const pluginInventoryRequests = {
  pluginInventory(
    context: DataContext,
    params: {pluginId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    return plugin.aspects.inventory.map(({name, description}) => ({
      name,
      description,
    }));
  },
  pluginInventoryItem(
    context: DataContext,
    params: {pluginId: string; inventoryId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    const inventory = plugin.aspects.inventory.find(
      inventory => inventory.name === params.inventoryId
    );
    if (!inventory) return null;
    return {
      name: inventory.name,
      plural: inventory.plural,
      description: inventory.description,
      tags: inventory.tags,
      volume: inventory.volume,
      durability: inventory.durability,
      continuous: inventory.continuous,
      flags: inventory.flags,
      assets: inventory.assets,
    };
  },
};

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
};

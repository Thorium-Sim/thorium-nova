import {DataContext} from "../../utils/DataContext";

export const pluginsRequest = {
  pluginsList(context: DataContext) {
    return context.server.plugins;
  },
  plugin(
    context: DataContext,
    params: {pluginId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    return context.server.plugins.find(plugin => plugin.id === params.pluginId);
  },
};

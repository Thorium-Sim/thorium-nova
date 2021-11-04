import {DataContext} from "server/src/utils/DataContext";

export function getPlugin(context: DataContext, pluginId: string) {
  const plugin = context.server.plugins.find(plugin => plugin.id === pluginId);
  if (!plugin) throw null;
  return plugin;
}

import BasePlugin from "server/src/classes/Plugins";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";

export function getPlugin(context: DataContext, pluginId: string): BasePlugin {
  const plugin = context.server.plugins.find(plugin => plugin.id === pluginId);
  if (!plugin) throw new Error("Plugin not found");
  return plugin;
}
export function publish(pluginId: string) {
  pubsub.publish("pluginsList");
  pubsub.publish("plugin", {pluginId});
}

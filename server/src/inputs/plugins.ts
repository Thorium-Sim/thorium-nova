import BasePlugin from "../classes/Plugins";
import {DataContext} from "../utils/DataContext";
import {pubsub} from "../utils/pubsub";

function getPlugin(context: DataContext, pluginId: string): BasePlugin {
  const plugin = context.server.plugins.find(plugin => plugin.id === pluginId);
  if (!plugin) throw new Error("Plugin not found");
  return plugin;
}
export const pluginInputs = {
  pluginCreate(context: DataContext, params: {name: string}) {
    const plugin = new BasePlugin(params);
    context.server.plugins.push(plugin);
    pubsub.publish("pluginsList");
    pubsub.publish("plugin", {pluginId: plugin.id});
    return plugin.id;
  },
  pluginDelete(context: DataContext, params: {pluginId: string}) {
    const plugin = getPlugin(context, params.pluginId);
    plugin.removeFile(true);
    context.server.plugins.splice(context.server.plugins.indexOf(plugin), 1);
    pubsub.publish("pluginsList");
    pubsub.publish("plugin", {pluginId: plugin.id});
  },
  pluginDuplicate(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);

    const pluginCopy = plugin.duplicate(params.name);
    context.server.plugins.push(pluginCopy);
    pubsub.publish("pluginsList");
    pubsub.publish("plugin", {pluginId: pluginCopy.id});
    return pluginCopy.id;
  },
  pluginSetName(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);

    plugin.name = params.name;
    pubsub.publish("pluginsList");
    pubsub.publish("plugin", {pluginId: plugin.id});
  },
  pluginSetDescription(
    context: DataContext,
    params: {pluginId: string; description: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);

    plugin.description = params.description;
    pubsub.publish("pluginsList");
    pubsub.publish("plugin", {pluginId: plugin.id});
  },
  pluginSetTags(
    context: DataContext,
    params: {pluginId: string; tags: string[]}
  ) {
    const plugin = getPlugin(context, params.pluginId);

    plugin.tags = params.tags;
    pubsub.publish("pluginsList");
    pubsub.publish("plugin", {pluginId: plugin.id});
  },
};

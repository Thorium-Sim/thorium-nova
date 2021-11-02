import BasePlugin from "../classes/Plugins";
import {DataContext} from "../utils/DataContext";
import {pubsub} from "../utils/pubsub";
import fs from "fs/promises";
import path from "path";
import {thoriumPath} from "../utils/appPaths";

function getPlugin(context: DataContext, pluginId: string): BasePlugin {
  const plugin = context.server.plugins.find(plugin => plugin.id === pluginId);
  if (!plugin) throw new Error("Plugin not found");
  return plugin;
}
function publish(pluginId: string) {
  pubsub.publish("pluginsList");
  pubsub.publish("plugin", {pluginId});
}

export const pluginInputs = {
  pluginCreate(context: DataContext, params: {name: string}) {
    const plugin = new BasePlugin(params, context.server);
    context.server.plugins.push(plugin);
    publish(plugin.id);
    return {pluginId: plugin.id};
  },
  pluginDelete(context: DataContext, params: {pluginId: string}) {
    const plugin = getPlugin(context, params.pluginId);
    plugin.removeFile();
    context.server.plugins.splice(context.server.plugins.indexOf(plugin), 1);
    publish(plugin.id);
  },
  pluginDuplicate(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);

    const pluginCopy = plugin.duplicate(params.name);
    context.server.plugins.push(pluginCopy);
    publish(plugin.id);
    return {pluginId: pluginCopy.id};
  },
  async pluginSetName(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    await plugin.rename(params.name);

    publish(plugin.id);
    return {pluginId: plugin.id};
  },
  pluginSetDescription(
    context: DataContext,
    params: {pluginId: string; description: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);

    plugin.description = params.description;
    publish(plugin.id);
  },
  pluginSetTags(
    context: DataContext,
    params: {pluginId: string; tags: string[]}
  ) {
    const plugin = getPlugin(context, params.pluginId);

    plugin.tags = params.tags;
    publish(plugin.id);
  },
  async pluginSetCoverImage(
    context: DataContext,
    params: {pluginId: string; coverImage: File | string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    // coverImage will be a string pointing to a temporary file
    // move it into place.
    if (plugin && typeof params.coverImage === "string") {
      const ext = path.extname(params.coverImage);
      const coverImagePath = path.join(
        thoriumPath,
        plugin.assetPath(`coverImage${ext}`)
      );

      await fs.mkdir(path.dirname(coverImagePath), {recursive: true});
      await fs.rename(params.coverImage, coverImagePath);
      plugin.coverImage = plugin.assetPath(`coverImage${ext}`);
      publish(plugin.id);
    }
  },
};

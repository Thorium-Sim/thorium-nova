import BasePlugin from "../../classes/Plugins";
import {DataContext} from "../../utils/DataContext";
import fs from "fs/promises";
import path from "path";
import {thoriumPath} from "../../utils/appPaths";
import {getPlugin, publish} from "./utils";

export const pluginInputs = {
  pluginCreate(context: DataContext, params: {name: string}) {
    const plugin = new BasePlugin(params, context.server);
    context.server.plugins.push(plugin);
    publish(plugin.id);
    return {pluginId: plugin.id};
  },
  async pluginDelete(context: DataContext, params: {pluginId: string}) {
    const plugin = getPlugin(context, params.pluginId);
    await plugin.removeFile();
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
  async pluginUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      name?: string;
      description?: string;
      tags?: string[];
      coverImage?: File | string;
      active?: boolean;
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    if (params.description) {
      plugin.description = params.description;
    }

    if (params.tags) {
      plugin.tags = params.tags;
    }
    if (typeof params.coverImage === "string") {
      const ext = path.extname(params.coverImage);
      const coverImagePath = path.join(
        thoriumPath,
        plugin.pluginPath,
        `assets/coverImage${ext}`
      );

      await fs.mkdir(path.dirname(coverImagePath), {recursive: true});
      await fs.rename(params.coverImage, coverImagePath);
      plugin.coverImage = `${plugin.pluginPath}/assets/coverImage${ext}`;
    }
    if (params.active !== undefined) {
      plugin.active = params.active;
    }
    if (params.name) {
      await plugin.rename(params.name);
    }
    publish(plugin.id);
    return {pluginId: plugin.id};
  },
};

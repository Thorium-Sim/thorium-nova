import ThemePlugin from "server/src/classes/Plugins/Theme";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "./utils";
import fs from "fs";
import path from "path";
const defaultCSS = fs.readFileSync(
  path.join(__dirname, "./defaultTheme.css"),
  "utf-8"
);

export const themesPluginInput = {
  async pluginThemeCreate(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const theme = new ThemePlugin({name: params.name}, plugin);
    plugin.aspects.themes.push(theme);

    await theme.setCSS(defaultCSS);

    pubsub.publish("pluginThemes", {pluginId: params.pluginId});
    return {themeId: theme.name};
  },
  async pluginThemeDelete(
    context: DataContext,
    params: {pluginId: string; themeId: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const theme = plugin.aspects.themes.find(
      theme => theme.name === params.themeId
    );
    if (!theme) throw new Error("Theme not found.");
    plugin.aspects.themes.splice(plugin.aspects.themes.indexOf(theme), 1);

    await theme?.removeFile();
    pubsub.publish("pluginThemes", {pluginId: params.pluginId});
  },
  async pluginThemeUpdate(
    context: DataContext,
    params: {pluginId: string; themeId: string; name?: string; rawCSS?: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const theme = plugin.aspects.themes.find(
      theme => theme.name === params.themeId
    );
    if (!theme) throw new Error("Theme not found.");
    let processedCSS = "";
    if (params.rawCSS) {
      processedCSS = await theme.setCSS(params.rawCSS);
    }
    if (params.name) {
      await theme.rename(params.name);
    }
    pubsub.publish("pluginThemes", {pluginId: params.pluginId});
    pubsub.publish("pluginTheme", {
      pluginId: params.pluginId,
      themeId: theme.name,
    });
    return {themeId: theme.name, processedCSS};
  },
  async pluginThemeDuplicate(
    context: DataContext,
    params: {pluginId: string; themeId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const theme = plugin.aspects.themes.find(
      theme => theme.name === params.themeId
    );
    if (!theme) throw new Error("Theme not found.");
    const themeCopy = await theme.duplicate(params.name);
    pubsub.publish("pluginThemes", {pluginId: params.pluginId});
    return {themeId: themeCopy.name};
  },
  async pluginThemeUploadFile(
    context: DataContext,
    params: {
      pluginId: string;
      themeId: string;
      file: File | string;
      fileName: string;
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const theme = plugin.aspects.themes.find(
      theme => theme.name === params.themeId
    );
    if (!theme) throw new Error("Theme not found.");
    if (typeof params.file !== "string") throw new Error("Invalid file.");
    await theme.addAsset(params.file, params.fileName);

    pubsub.publish("pluginThemes", {pluginId: params.pluginId});
    pubsub.publish("pluginTheme", {
      pluginId: params.pluginId,
      themeId: theme.name,
    });
    return {themeId: theme.name};
  },
  async pluginThemeRemoveFile(
    context: DataContext,
    params: {pluginId: string; themeId: string; file: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const theme = plugin.aspects.themes.find(
      theme => theme.name === params.themeId
    );
    if (!theme) throw new Error("Theme not found.");
    if (typeof params.file !== "string") throw new Error("Invalid file.");
    await theme.removeAsset(params.file);

    pubsub.publish("pluginThemes", {pluginId: params.pluginId});
    pubsub.publish("pluginTheme", {
      pluginId: params.pluginId,
      themeId: theme.name,
    });
    return {themeId: theme.name};
  },
};

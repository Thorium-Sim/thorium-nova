import {DataContext} from "server/src/utils/DataContext";
import {getPlugin} from "./utils";

export const pluginThemesRequest = {
  pluginThemes(
    context: DataContext,
    params: {pluginId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    return plugin.aspects.themes.map(theme => ({
      ...theme,
      rawCSS: theme.rawCSS,
      processedCSS: theme.processedCSS,
    }));
  },
  async pluginTheme(
    context: DataContext,
    params: {pluginId: string; themeId: string},
    publishParams: {pluginId: string; themeId: string} | null
  ) {
    if (
      publishParams &&
      (params.pluginId !== publishParams.pluginId ||
        params.themeId !== publishParams.themeId)
    )
      throw null;
    const plugin = getPlugin(context, params.pluginId);
    const theme = plugin.aspects.themes.find(
      theme => theme.name === params.themeId
    );
    if (!theme) throw null;

    return {...theme, rawCSS: theme.rawCSS, processedCSS: theme.processedCSS};
  },
  pluginAllThemes(context: DataContext) {
    return context.server.plugins.reduce(
      (themes: {themeId: string; pluginId: string}[], plugin) => {
        return themes.concat(
          plugin.aspects.themes.map(theme => ({
            themeId: theme.name,
            pluginId: plugin.id,
          }))
        );
      },
      []
    );
  },
};

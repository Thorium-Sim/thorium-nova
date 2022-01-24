import {DataContext} from "server/src/utils/DataContext";
import {getPlugin} from "./utils";

export const pluginSolarSystemsRequest = {
  pluginSolarSystems(
    context: DataContext,
    params: {pluginId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    return plugin.aspects.solarSystems;
  },
  pluginSolarSystem(
    context: DataContext,
    params: {pluginId: string; solarSystemId: string},
    publishParams: {pluginId: string; solarSystemId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    const solarSystem = plugin.aspects.solarSystems.find(
      solarSystem => solarSystem.name === params.solarSystemId
    );
    if (!solarSystem) throw null;
    return solarSystem;
  },
};

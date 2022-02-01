import SolarSystemPlugin from "server/src/classes/Plugins/Universe/SolarSystem";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {AstronomicalUnit, LightMinute} from "server/src/utils/unitTypes";
import {getPlugin} from "./utils";

export const solarSystemsPluginInputs = {
  pluginSolarSystemCreate(
    context: DataContext,
    params: {
      pluginId: string;
      position: {
        x: LightMinute;
        y: LightMinute;
        z: LightMinute;
      };
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const solarSystem = new SolarSystemPlugin(
      {position: params.position},
      plugin
    );
    plugin.aspects.solarSystems.push(solarSystem);

    pubsub.publish("pluginSolarSystems", {pluginId: params.pluginId});

    return {solarSystemId: solarSystem.name};
  },
  async pluginSolarSystemDelete(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const solarSystem = plugin.aspects.solarSystems.find(
      solarSystem => solarSystem.name === params.solarSystemId
    );
    if (!solarSystem) return;
    plugin.aspects.solarSystems.splice(
      plugin.aspects.solarSystems.indexOf(solarSystem),
      1
    );

    await solarSystem?.removeFile();
    pubsub.publish("pluginSolarSystems", {pluginId: params.pluginId});
  },
  async pluginSolarSystemUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      solarSystemId: string;
      position?: {
        x: LightMinute;
        y: LightMinute;
        z: LightMinute;
      };
      name?: string;
      description?: string;
      tags?: string[];
      habitableZoneInner?: AstronomicalUnit;
      habitableZoneOuter?: AstronomicalUnit;
      skyboxKey?: string;
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    if (!params.solarSystemId) throw new Error("Solar System ID is required");
    const solarSystem = plugin.aspects.solarSystems.find(
      solarSystem => solarSystem.name === params.solarSystemId
    );
    if (!solarSystem) return {solarSystemId: ""};
    if (params.position) solarSystem.position = params.position;
    if (params.name) solarSystem.name = params.name;
    if (params.description) solarSystem.description = params.description;
    if (params.tags) solarSystem.tags = params.tags;
    if (params.habitableZoneInner)
      solarSystem.habitableZoneInner = params.habitableZoneInner;
    if (params.habitableZoneOuter)
      solarSystem.habitableZoneOuter = params.habitableZoneOuter;
    if (params.skyboxKey) solarSystem.skyboxKey = params.skyboxKey;

    pubsub.publish("pluginSolarSystems", {pluginId: params.pluginId});
    pubsub.publish("pluginSolarSystem", {
      pluginId: params.pluginId,
      solarSystemId: solarSystem.name,
    });
    return {solarSystemId: solarSystem.name};
  },
};

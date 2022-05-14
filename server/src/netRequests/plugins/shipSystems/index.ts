import {
  AllShipSystems,
  ShipSystemTypes,
} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {DataContext} from "server/src/utils/DataContext";
import {getPlugin} from "../utils";

export const pluginShipSystemsRequests = {
  pluginShipSystems(
    context: DataContext,
    params: {pluginId?: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    if (!params?.pluginId)
      return context.server.plugins
        .reduce(
          (acc, plugin) => acc.concat(plugin.aspects.shipSystems),
          [] as typeof plugin.aspects.shipSystems
        )
        .map(({plugin, ...shipSystem}) => ({
          ...shipSystem,
          pluginName: plugin.name,
        }));
    const plugin = getPlugin(context, params.pluginId);
    return plugin.aspects.shipSystems.map(({plugin, ...shipSystem}) => ({
      ...shipSystem,
      pluginName: plugin.name,
    }));
  },
  pluginShipSystem<T extends keyof AllShipSystems>(
    context: DataContext,
    params: {
      pluginId: string;
      type?: T;
      systemId: string;
      shipId?: string;
      shipPluginId?: string;
    },
    publishParams: {pluginId: string; systemId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    let override = {};
    if (params.shipPluginId) {
      const plugin = getPlugin(context, params.shipPluginId);
      const ship = plugin.aspects.ships.find(s => s.name === params.shipId);
      if (ship) {
        const system = ship.shipSystems.find(
          s =>
            s.systemId === params.systemId && s.pluginId === params.shipPluginId
        );
        if (system) {
          if (!system.overrides) {
            system.overrides = {};
          }
          override = system.overrides;
        }
      }
    }
    const plugin = getPlugin(context, params.pluginId);
    const shipSystem = plugin.aspects.shipSystems.find(
      system => system.name === params.systemId
    ) as AllShipSystems[keyof AllShipSystems];
    if (!shipSystem) throw null;
    const {plugin: sysPlugin, ...system} = shipSystem;

    return {
      ...system,
      ...override,
      pluginName: plugin.name,
    } as AllShipSystems[T];
  },
  availableShipSystems() {
    return Object.keys(ShipSystemTypes).map(key => {
      const type = key as keyof typeof ShipSystemTypes;
      const systemConstructor = ShipSystemTypes[type];
      return {type, flags: systemConstructor.flags};
    });
  },
};

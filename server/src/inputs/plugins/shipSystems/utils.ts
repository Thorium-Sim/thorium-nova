import {getPlugin} from "@client/data/plugins/utils";
import type {AllShipSystems} from "@server/classes/Plugins/ShipSystems/shipSystemTypes";
import type {DataContext} from "@server/utils/DataContext";

/**
 * Gets a ship system plugin. You need to pass in the plugin type to get proper type inference.
 */
export function getShipSystem<
  T extends keyof AllShipSystems,
  Sys extends AllShipSystems[T]
>(
  context: DataContext,
  pluginId: string,
  shipSystemId: string,
  shipSystemType: T,
  shipPluginId?: string,
  shipId?: string
): [Sys, null | Record<string, any>] {
  const plugin = getPlugin(context, pluginId);
  let override = null;
  if (shipPluginId) {
    const plugin = getPlugin(context, shipPluginId);
    const ship = plugin.aspects.ships.find(s => s.name === shipId);
    if (!ship) {
      throw new Error("Ship not found");
    }
    const system = ship.shipSystems.find(
      s => s.systemId === shipSystemId && s.pluginId === shipPluginId
    );
    if (!system) {
      throw new Error("Ship system is not assigned to ship");
    }
    if (!system.overrides) {
      system.overrides = {};
    }
    override = system.overrides;
  }
  const shipSystem = plugin.aspects.shipSystems.find(
    s => s.name === shipSystemId
  ) as Sys;
  if (!shipSystem || shipSystem.type !== shipSystemType) {
    throw new Error("Ship system not found");
  }
  return [shipSystem, override];
}

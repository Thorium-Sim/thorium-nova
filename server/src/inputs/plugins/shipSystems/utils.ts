import {AllShipSystems} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {DataContext} from "server/src/utils/DataContext";
import {getPlugin} from "../utils";

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
  shipSystemType: T
): Sys {
  const plugin = getPlugin(context, pluginId);
  const shipSystem = plugin.aspects.shipSystems.find(
    s => s.name === shipSystemId
  ) as Sys;
  if (!shipSystem || shipSystem.type !== shipSystemType) {
    throw new Error("Ship system not found");
  }
  return shipSystem;
}

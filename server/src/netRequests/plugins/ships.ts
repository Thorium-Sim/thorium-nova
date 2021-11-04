import {DataContext} from "server/src/utils/DataContext";
import {getPlugin} from "./utils";

export const pluginShipsRequest = {
  pluginShips(
    context: DataContext,
    params: {pluginId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    return plugin.aspects.ships;
  },
  pluginShip(
    context: DataContext,
    params: {pluginId: string; shipId: string},
    publishParams: {pluginId: string; shipId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) throw null;
    return ship;
  },
};

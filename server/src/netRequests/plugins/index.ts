import {DataContext} from "../../utils/DataContext";

export const pluginsRequest = {
  pluginsList(context: DataContext) {
    return context.server.plugins;
  },
  plugin(
    context: DataContext,
    params: {pluginId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    return context.server.plugins.find(plugin => plugin.id === params.pluginId);
  },
  // pluginShips(
  //   context: DataContext,
  //   params: {pluginId: string},
  //   publishParams: {pluginId: string} | null
  // ) {
  //   if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
  //   const plugin = context.server.plugins.find(
  //     plugin => plugin.id === params.pluginId
  //   );
  //   if (!plugin) throw null;
  //   return plugin.ships;
  // },
  // pluginShip(
  //   context: DataContext,
  //   params: {pluginId: string; shipId: string},
  //   publishParams: {pluginId: string; shipId: string} | null
  // ) {
  //   if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
  //   const plugin = context.server.plugins.find(
  //     plugin => plugin.id === params.pluginId
  //   );
  //   if (!plugin) throw null;
  //   const ship = plugin.ships.find(ship => ship.id === params.shipId);
  //   if (!ship) throw null;
  //   return ship;
  // },
};

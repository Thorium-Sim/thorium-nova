import ShipPlugin from "server/src/classes/Plugins/Ship";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "./utils";

export const shipsPluginInputs = {
  pluginShipCreate(
    context: DataContext,
    params: {pluginId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = new ShipPlugin({name: params.name}, plugin);
    plugin.aspects.ships.push(ship);

    pubsub.publish("pluginShips", {pluginId: params.pluginId});
    return {shipId: ship.name};
  },
  async pluginShipDelete(
    context: DataContext,
    params: {pluginId: string; shipId: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) return;
    plugin.aspects.ships.splice(plugin.aspects.ships.indexOf(ship), 1);

    await ship?.removeFile();
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
  },
  pluginShipSetName(
    context: DataContext,
    params: {pluginId: string; shipId: string; name: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    ship?.rename(params.name);
    pubsub.publish("pluginShips", {pluginId: params.pluginId});
  },
};

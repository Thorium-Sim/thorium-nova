import {ShipSystemTypes} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "../utils";

export const shipSystemsPluginInput = {
  async pluginShipSystemCreate(
    context: DataContext,
    params: {pluginId: string; name: string; type: keyof typeof ShipSystemTypes}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const ShipSystemClass = ShipSystemTypes[params.type];
    const shipSystem = new ShipSystemClass({name: params.name}, plugin);
    plugin.aspects.shipSystems.push(shipSystem);

    pubsub.publish("pluginShipSystems", {pluginId: params.pluginId});
    return {shipSystemId: shipSystem.name};
  },
  async pluginShipSystemDelete(
    context: DataContext,
    params: {pluginId: string; shipSystemId: string}
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const shipSystem = plugin.aspects.shipSystems.find(
      s => s.name === params.shipSystemId
    );
    if (!shipSystem) {
      throw new Error("Ship system not found");
    }
    plugin.aspects.shipSystems.splice(
      plugin.aspects.shipSystems.indexOf(shipSystem),
      1
    );

    pubsub.publish("pluginShipSystems", {pluginId: params.pluginId});
    return {shipSystemId: shipSystem.name};
  },
  async pluginShipSystemUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      name?: string;
      description?: string;
      tags?: string[];
    }
  ) {
    const plugin = getPlugin(context, params.pluginId);
    const shipSystem = plugin.aspects.shipSystems.find(
      s => s.name === params.shipSystemId
    );
    if (!shipSystem) {
      throw new Error("Ship system not found");
    }
    if (params.name) {
      await shipSystem.rename(params.name);
    }
    if (typeof params.description === "string") {
      shipSystem.description = params.description;
    }
    if (params.tags) {
      shipSystem.tags = params.tags;
    }

    pubsub.publish("pluginShipSystems", {pluginId: params.pluginId});
    return {shipSystemId: shipSystem.name};
  },
};

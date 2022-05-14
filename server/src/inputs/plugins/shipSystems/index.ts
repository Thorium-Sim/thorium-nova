import {ShipSystemTypes} from "server/src/classes/Plugins/ShipSystems/shipSystemTypes";
import {DataContext} from "server/src/utils/DataContext";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "../utils";

export const shipSystemsPluginInput = {
  async pluginShipSystemCreate(
    context: DataContext,
    params: {pluginId: string; name: string; type: keyof typeof ShipSystemTypes}
  ) {
    inputAuth(context);
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
    inputAuth(context);
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
      shipId?: string;
      shipPluginId?: string;
      name?: string;
      description?: string;
      tags?: string[];
    }
  ) {
    inputAuth(context);
    const [system, override] = getShipSystem(context, params);
    let shipSystem = override || system;

    if (!system || !shipSystem) {
      throw new Error("Ship system not found");
    }
    if (params.name) {
      if (shipSystem.rename) {
        await shipSystem.rename(params.name);
      } else {
        shipSystem.name = params.name;
      }
    }
    if (typeof params.description === "string") {
      shipSystem.description = params.description;
    }
    if (params.tags) {
      shipSystem.tags = params.tags;
    }

    if (params.shipPluginId && params.shipId) {
      pubsub.publish("pluginShip", {
        pluginId: params.shipPluginId,
        shipId: params.shipId,
      });
    }
    pubsub.publish("pluginShipSystems", {pluginId: params.pluginId});
    pubsub.publish("pluginShipSystem", {
      pluginId: params.pluginId,
      systemId: system.name,
    });
    return {shipSystemId: system.name};
  },
  pluginShipSystemRestoreOverride(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      shipId: string;
      shipPluginId: string;
      property: string;
    }
  ) {
    inputAuth(context);
    const [system, override] = getShipSystem(context, params);

    if (override) {
      delete override[params.property];
    }

    pubsub.publish("pluginShip", {
      pluginId: params.shipPluginId,
      shipId: params.shipId,
    });
    if (system) {
      pubsub.publish("pluginShipSystems", {pluginId: params.pluginId});
      pubsub.publish("pluginShipSystem", {
        pluginId: params.pluginId,
        systemId: system.name,
      });
    }
  },
};

function getShipSystem(
  context: DataContext,
  params: {
    pluginId: string;
    shipId?: string;
    shipPluginId?: string;
    shipSystemId: string;
  }
) {
  let override = null;
  if (params.shipPluginId) {
    const plugin = getPlugin(context, params.shipPluginId);
    const ship = plugin.aspects.ships.find(s => s.name === params.shipId);
    if (!ship) {
      throw new Error("Ship not found");
    }
    const system = ship.shipSystems.find(
      s =>
        s.systemId === params.shipSystemId && s.pluginId === params.shipPluginId
    );
    if (!system) {
      throw new Error("Ship system is not assigned to ship");
    }
    if (!system.overrides) {
      system.overrides = {};
    }
    override = system.overrides;
  }
  const plugin = getPlugin(context, params.pluginId);
  return [
    plugin.aspects.shipSystems.find(s => s.name === params.shipSystemId),
    override,
  ] as const;
}

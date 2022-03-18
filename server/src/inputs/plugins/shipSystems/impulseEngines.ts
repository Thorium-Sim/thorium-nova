import ImpulseEnginesPlugin from "server/src/classes/Plugins/ShipSystems/ImpulseEngines";
import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {KilometerPerSecond, KiloNewtons} from "server/src/utils/unitTypes";
import {getPlugin} from "../utils";

function getShipSystem(
  context: DataContext,
  pluginId: string,
  shipSystemId: string
): ImpulseEnginesPlugin {
  const plugin = getPlugin(context, pluginId);
  const shipSystem = plugin.aspects.shipSystems.find(
    s => s.name === shipSystemId
  ) as ImpulseEnginesPlugin;
  if (!shipSystem || shipSystem.type !== "impulseEngines") {
    throw new Error("Ship system not found");
  }
  return shipSystem;
}

export const impulseEnginesPluginInput = {
  async impulseEnginesPluginUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      cruisingSpeed?: KilometerPerSecond;
      emergencySpeed?: KilometerPerSecond;
      thrust?: KiloNewtons;
    }
  ) {
    const shipSystem = getShipSystem(
      context,
      params.pluginId,
      params.shipSystemId
    );
    if (typeof params.cruisingSpeed === "number") {
      shipSystem.cruisingSpeed = params.cruisingSpeed;
    }
    if (typeof params.emergencySpeed === "number") {
      shipSystem.emergencySpeed = params.emergencySpeed;
    }
    if (typeof params.thrust === "number") {
      shipSystem.thrust = params.thrust;
    }

    pubsub.publish("pluginShipSystem", {
      pluginId: params.pluginId,
      systemId: params.shipSystemId,
    });

    return shipSystem;
  },
};

import {DataContext} from "server/src/utils/DataContext";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {KilometerPerSecond, KiloNewtons} from "server/src/utils/unitTypes";
import {getShipSystem} from "./utils";

export const impulseEnginesPluginInput = {
  async pluginImpulseEnginesUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      cruisingSpeed?: KilometerPerSecond;
      emergencySpeed?: KilometerPerSecond;
      thrust?: KiloNewtons;
    }
  ) {
    inputAuth(context);
    const shipSystem = getShipSystem(
      context,
      params.pluginId,
      params.shipSystemId,
      "impulseEngines"
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

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
      shipPluginId?: string;
      shipId?: string;
      cruisingSpeed?: KilometerPerSecond;
      emergencySpeed?: KilometerPerSecond;
      thrust?: KiloNewtons;
    }
  ) {
    inputAuth(context);
    const [system, override] = getShipSystem(
      context,
      params.pluginId,
      params.shipSystemId,
      "impulseEngines",
      params.shipPluginId,
      params.shipId
    );
    const shipSystem = override || system;

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
    if (params.shipPluginId && params.shipId) {
      pubsub.publish("pluginShip", {
        pluginId: params.shipPluginId,
        shipId: params.shipId,
      });
    }

    return shipSystem;
  },
};

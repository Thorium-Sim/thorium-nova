import {DataContext} from "server/src/utils/DataContext";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {
  KiloNewtons,
  MetersPerSecond,
  RotationsPerMinute,
} from "server/src/utils/unitTypes";
import {getShipSystem} from "./utils";

export const thrustersPluginInput = {
  async pluginThrustersUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      shipPluginId?: string;
      shipId?: string;
      directionMaxSpeed?: MetersPerSecond;
      directionThrust?: KiloNewtons;
      rotationMaxSpeed?: RotationsPerMinute;
      rotationThrust?: KiloNewtons;
    }
  ) {
    inputAuth(context);
    const [system, override] = getShipSystem(
      context,
      params.pluginId,
      params.shipSystemId,
      "thrusters",
      params.shipPluginId,
      params.shipId
    );
    const shipSystem = override || system;

    if (typeof params.directionMaxSpeed === "number") {
      shipSystem.directionMaxSpeed = params.directionMaxSpeed;
    }
    if (typeof params.directionThrust === "number") {
      shipSystem.directionThrust = params.directionThrust;
    }
    if (typeof params.rotationMaxSpeed === "number") {
      shipSystem.rotationMaxSpeed = params.rotationMaxSpeed;
    }
    if (typeof params.rotationThrust === "number") {
      shipSystem.rotationThrust = params.rotationThrust;
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

import {DataContext} from "server/src/utils/DataContext";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {getShipSystem} from "./utils";

export const inertialDampenersPluginInput = {
  async pluginInertialDampenersUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      shipPluginId?: string;
      shipId?: string;
      dampening: number;
    }
  ) {
    inputAuth(context);
    const [system, override] = getShipSystem(
      context,
      params.pluginId,
      params.shipSystemId,
      "inertialDampeners",
      params.shipPluginId,
      params.shipId
    );
    const shipSystem = override || system;

    if (typeof params.dampening === "number" && params.dampening > 0) {
      shipSystem.dampening = params.dampening;
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

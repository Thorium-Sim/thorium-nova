import InertialDampenersPlugin from "server/src/classes/Plugins/ShipSystems/InertialDampeners";
import {DataContext} from "server/src/utils/DataContext";
import inputAuth from "server/src/utils/inputAuth";
import {pubsub} from "server/src/utils/pubsub";
import {getPlugin} from "../utils";

function getShipSystem(
  context: DataContext,
  pluginId: string,
  shipSystemId: string
): InertialDampenersPlugin {
  const plugin = getPlugin(context, pluginId);
  const shipSystem = plugin.aspects.shipSystems.find(
    s => s.name === shipSystemId
  ) as InertialDampenersPlugin;
  if (!shipSystem || shipSystem.type !== "inertialDampeners") {
    throw new Error("Ship system not found");
  }
  return shipSystem;
}

export const inertialDampenersPluginInput = {
  async pluginInertialDampenersUpdate(
    context: DataContext,
    params: {
      pluginId: string;
      shipSystemId: string;
      dampening: number;
    }
  ) {
    inputAuth(context);
    const shipSystem = getShipSystem(
      context,
      params.pluginId,
      params.shipSystemId
    );
    if (typeof params.dampening === "number" && params.dampening > 0) {
      shipSystem.dampening = params.dampening;
    }
    pubsub.publish("pluginShipSystem", {
      pluginId: params.pluginId,
      systemId: params.shipSystemId,
    });

    return shipSystem;
  },
};

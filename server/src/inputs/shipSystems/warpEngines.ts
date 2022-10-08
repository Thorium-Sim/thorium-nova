import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {getShipSystem} from "./getShipSystem";

export const warpEnginesInputs = {
  warpEnginesSetWarpFactor: (
    context: DataContext,
    params: {systemId?: number; factor: number}
  ) => {
    if (!context.ship) throw new Error("No ship found.");

    const system = getShipSystem(context, {
      systemId: params.systemId,
      systemType: "warpEngines",
    });
    if (!system.components.isWarpEngines)
      throw new Error("System is not a warp engine");

    system.updateComponent("isWarpEngines", {
      currentWarpFactor: params.factor,
    });

    pubsub.publish("pilotWarpEngines", {
      shipId: context.ship?.id,
      systemId: system.id,
    });
    return system;
  },
};

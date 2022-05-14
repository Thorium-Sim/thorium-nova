import {DataContext} from "server/src/utils/DataContext";
import {pubsub} from "server/src/utils/pubsub";
import {getShipSystem} from "./getShipSystem";

export const warpEnginesInputs = {
  warpEnginesSetWarpFactor: (
    context: DataContext,
    params: {systemId?: number; factor: number}
  ) => {
    const system = getShipSystem(context, {
      systemId: params.systemId,
      systemType: "warpEngines",
    });
    if (!system.components.isWarpEngines)
      throw new Error("System is not a warp engine");
    const {interstellarCruisingSpeed, solarCruisingSpeed} =
      system.components.isWarpEngines;

    system.updateComponent("isWarpEngines", {
      currentWarpFactor: params.factor,
    });
    // @ts-expect-error We can remove this once the warp engines card data is defined.
    pubsub.publish("warpEngines", {
      shipId: context.ship?.id,
      systemId: system.id,
    });
    return system;
  },
};

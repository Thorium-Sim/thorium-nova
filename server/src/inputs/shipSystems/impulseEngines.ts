import {DataContext} from "server/src/utils/DataContext";
import {getShipSystem} from "./getShipSystem";

export const impulseEnginesInputs = {
  impulseEnginesSetTargetSpeed: (
    context: DataContext,
    params: {systemId?: number; speed: number}
  ) => {
    const system = getShipSystem(context, {
      systemId: params.systemId,
      systemType: "impulseEngines",
    });
    if (!system.components.isImpulseEngines)
      throw new Error("System is not a impulse engine");

    system.updateComponent("isImpulseEngines", {targetSpeed: params.speed});

    // @ts-expect-error We can remove this once the impulse engines card data is defined.
    pubsub.publish("impulseEngines", {
      shipId: context.ship?.id,
      systemId: system.id,
    });
    return system;
  },
};

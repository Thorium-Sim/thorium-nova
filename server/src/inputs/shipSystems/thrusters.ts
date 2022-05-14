import {DataContext} from "server/src/utils/DataContext";
import {
  Coordinates,
  MetersPerSecond,
  RadiansPerSecond,
} from "server/src/utils/unitTypes";
import {getShipSystem} from "./getShipSystem";

export const thrustersInputs = {
  thrustersSetDirection: (
    context: DataContext,
    params: {systemId?: number; direction: Coordinates<MetersPerSecond>}
  ) => {
    const system = getShipSystem(context, {
      systemId: params.systemId,
      systemType: "thrusters",
    });
    if (!system.components.isThrusters)
      throw new Error("System is not thrusters");

    system.updateComponent("isThrusters", {direction: params.direction});

    // @ts-expect-error We can remove this once the thrusters card data is defined.
    pubsub.publish("thrusters", {
      shipId: context.ship?.id,
      systemId: system.id,
    });
    return system;
  },
  thrustersSetRotationDelta: (
    context: DataContext,
    params: {systemId?: number; rotation: Coordinates<RadiansPerSecond>}
  ) => {
    const system = getShipSystem(context, {
      systemId: params.systemId,
      systemType: "thrusters",
    });
    if (!system.components.isThrusters)
      throw new Error("System is not thrusters");

    system.updateComponent("isThrusters", {rotationDelta: params.rotation});

    // @ts-expect-error We can remove this once the thrusters card data is defined.
    pubsub.publish("thrusters", {
      shipId: context.ship?.id,
      systemId: system.id,
    });
    return system;
  },
};

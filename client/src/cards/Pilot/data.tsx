import {getShipSystem} from "server/src/inputs/shipSystems/getShipSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {pubsub} from "server/src/utils/pubsub";

export const requests = {
  pilotImpulseEngines(
    context: DataContext,
    params: {},
    publishParams: {shipId: number; systemId: number}
  ) {
    if (publishParams && publishParams.shipId !== context.ship?.id) throw null;

    // Currently only support one impulse engines
    const impulseEngines = getShipSystem(context, {
      systemType: "impulseEngines",
    });
    return {
      id: impulseEngines.id,
      targetSpeed: impulseEngines.components.isImpulseEngines?.targetSpeed || 0,
      cruisingSpeed:
        impulseEngines.components.isImpulseEngines?.cruisingSpeed || 1,
      emergencySpeed:
        impulseEngines.components.isImpulseEngines?.emergencySpeed || 1,
    };
  },
  pilotWarpEngines(
    context: DataContext,
    params: {},
    publishParams: {shipId: number; systemId: number}
  ) {
    if (publishParams && publishParams.shipId !== context.ship?.id) throw null;
    // Currently only support one warp engines
    const warpEngines = getShipSystem(context, {systemType: "warpEngines"});
    return {
      id: warpEngines.id,
      warpFactorCount:
        warpEngines.components.isWarpEngines?.warpFactorCount || 5,
      maxVelocity: warpEngines.components.isWarpEngines?.maxVelocity || 0,
      currentWarpFactor:
        warpEngines.components.isWarpEngines?.currentWarpFactor || 0,
    };
  },
};

export function dataStream(
  entity: Entity,
  context: DataContext,
  params: {systemId: number | null}
): boolean {
  return Boolean(
    (entity.components.position &&
      entity.components.position.parentId === params.systemId) ||
      ((entity.components.isWarpEngines ||
        entity.components.isImpulseEngines) &&
        context.ship?.components.shipSystems?.shipSystemIds.includes(entity.id))
  );
}

export const inputs = {
  impulseEnginesSetSpeed(
    context: DataContext,
    params: {systemId?: number; speed: number}
  ) {
    if (!context.ship) throw new Error("No ship found.");

    const system = getShipSystem(context, {
      systemId: params.systemId,
      systemType: "impulseEngines",
    });

    if (!system.components.isImpulseEngines)
      throw new Error("System is not a impulse engine");

    system.updateComponent("isImpulseEngines", {
      targetSpeed: params.speed,
    });

    pubsub.publish("pilotImpulseEngines", {
      shipId: context.ship?.id,
      systemId: system.id,
    });
    return system;
  },
};

import {getShipSystem} from "server/src/inputs/shipSystems/getShipSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {pubsub} from "server/src/utils/pubsub";

export const requests = {
  pilotPlayerShip(context: DataContext) {
    if (!context.ship) throw new Error("Cannot find ship");
    const systemId = context.ship.components.position?.parentId;
    const systemPosition = systemId
      ? context.flight?.ecs.getEntityById(systemId)?.components.position || null
      : null;
    return {
      id: context.ship.id,
      currentSystem: systemId || null,
      systemPosition,
    };
  },
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
      interstellarCruisingSpeed:
        warpEngines.components.isWarpEngines?.interstellarCruisingSpeed ||
        599600000000,
      solarCruisingSpeed:
        warpEngines.components.isWarpEngines?.solarCruisingSpeed || 29980000,
    };
  },
  autopilot(context: DataContext, params: {}, publishParams: {shipId: number}) {
    if (publishParams && publishParams.shipId !== context.ship?.id) throw null;
    if (!context.ship) throw new Error("Ship not found");

    const waypointId = context.ship.components.autopilot?.destinationWaypointId;
    let destinationName = "";
    if (typeof waypointId === "number") {
      const waypoint = context.flight?.ecs.getEntityById(waypointId);
      destinationName =
        waypoint?.components.identity?.name.replace(" Waypoint", "").trim() ||
        "";
    }

    return {
      forwardAutopilot: context.ship.components.autopilot?.forwardAutopilot,
      destinationName,
      locked: !!context.ship.components.autopilot?.desiredCoordinates,
    };
  },
};

export function dataStream(
  entity: Entity,
  context: DataContext,
  params?: {systemId: number | null}
): boolean {
  const systemId =
    params?.systemId || context.ship?.components.position?.parentId;
  if (typeof systemId === "undefined") {
    return false;
  }
  return Boolean(
    (entity.components.position &&
      entity.components.position.parentId === systemId) ||
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
  autopilotLockCourse(context: DataContext, params: {waypointId: number}) {
    if (!context.ship) throw new Error("Ship not found.");
    const waypoint = context.flight?.ecs.getEntityById(params.waypointId);
    const position = waypoint?.components.position;
    if (!waypoint || !position) throw new Error("Waypoint not found.");

    context.ship.updateComponent("autopilot", {
      destinationWaypointId: params.waypointId,
      desiredCoordinates: {x: position.x, y: position.y, z: position.z},
      desiredSolarSystemId: position.parentId,
      rotationAutopilot: true,
      forwardAutopilot: false,
    });

    pubsub.publish("autopilot", {shipId: context.ship.id});
  },
  autopilotUnlockCourse(context: DataContext) {
    if (!context.ship) throw new Error("Ship not found.");

    context.ship.updateComponent("autopilot", {
      destinationWaypointId: null,
      desiredCoordinates: undefined,
      desiredSolarSystemId: undefined,
      rotationAutopilot: false,
      forwardAutopilot: false,
    });

    // Clear out the current thruster adjustments
    const thrusters = context.flight?.ecs.entities.find(
      e =>
        e.components.isThrusters &&
        context.ship?.components.shipSystems?.shipSystemIds.includes(e.id)
    );
    thrusters?.updateComponent("isThrusters", {
      rotationDelta: {x: 0, y: 0, z: 0},
    });

    pubsub.publish("autopilot", {shipId: context.ship.id});
  },
  autopilotActivate(context: DataContext) {
    if (!context.ship) throw new Error("Ship not found.");

    context.ship.updateComponent("autopilot", {
      forwardAutopilot: true,
    });

    pubsub.publish("autopilot", {shipId: context.ship.id});
  },
  autopilotDeactivate(context: DataContext) {
    if (!context.ship) throw new Error("Ship not found.");
    context.ship.updateComponent("autopilot", {
      forwardAutopilot: false,
    });
    // We specifically won't clear out the impulse and warp because
    // we want the ship to maintain its current speed.

    pubsub.publish("autopilot", {shipId: context.ship.id});
  },
};

import type {Entity} from "@server/utils/ecs";

export function dataStreamEntity(e: Entity) {
  // For snapshot interpolation, entities have to be flat, other than quaternions.
  // See https://github.com/geckosio/snapshot-interpolation#world-state
  // We're also removing any components of the entity that don't update
  // frequently to keep packet size down.

  if (e.components.isReactor) {
    return {
      id: e.id.toString(),
      x: e.components.isReactor.currentOutput,
      y: e.components.heat?.heat || 0,
    };
  }
  if (e.components.isBattery) {
    return {
      id: e.id.toString(),
      x: e.components.isBattery.storage,
      y: e.components.isBattery.chargeAmount,
      z: e.components.isBattery.dischargeAmount,
    };
  }
  if (e.components.isPowerNode) {
    return {
      id: e.id.toString(),
      x: e.components.isPowerNode.powerInput,
      y: e.components.isPowerNode.powerRequirement,
    };
  }
  if (e.components.isImpulseEngines) {
    let {targetSpeed, cruisingSpeed} = e.components.isImpulseEngines;
    if (e.components.power) {
      const {currentPower, maxSafePower, requiredPower} =
        e.components.power || {};

      targetSpeed = Math.max(
        0,
        cruisingSpeed *
          ((currentPower - requiredPower) / (maxSafePower - requiredPower))
      );
    }
    return {
      id: e.id.toString(),
      x: targetSpeed,
    };
  }
  if (e.components.isWarpEngines) {
    const {maxVelocity} = e.components.isWarpEngines;
    return {
      id: e.id.toString(),
      x: maxVelocity,
    };
  }

  const {parentId, type, ...position} = e.components.position || {};
  const shouldSnap = e.components.snapInterpolation ? 1 : 0;
  e.removeComponent("snapInterpolation");
  return {
    id: e.id.toString(),
    ...position,
    f: e.components.velocity?.forwardVelocity || 0,
    s: shouldSnap,
    r: e.components.rotation,
  };
}

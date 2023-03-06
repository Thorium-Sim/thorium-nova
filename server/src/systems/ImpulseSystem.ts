import {Entity, System} from "../utils/ecs";

const SOFT_BRAKE_CONST = 5;

/**
 * Determines the forward velocity applied by the impulse engines
 * based on the mass of the ship they are attached to.
 *
 * This works based on the power provided to the system.
 * The powerDraw and currentPower have already been calculated
 * by other systems. This system takes the currentPower value and
 * reverses the operation to determine what the actual target speed
 * is based on the power provided.
 *
 * It might be necessary to adjust the applied thrust as well, but
 * it also might not be necessary.
 */
export class ImpulseSystem extends System {
  WarpSystem?: System;
  constructor() {
    super();
    setTimeout(() => {
      this.WarpSystem = this.ecs?.systems.find(
        s => s.constructor.name === "WarpSystem"
      );
    }, 0);
  }
  test(entity: Entity) {
    return !!(
      entity.components.isImpulseEngines && entity.components.isShipSystem
    );
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;

    const ship = this.ecs.entities.find(e =>
      e.components.shipSystems?.shipSystems.has(entity.id)
    );
    if (!ship || !ship.components.isShip || !entity.components.isImpulseEngines)
      return;

    const warp = this.WarpSystem?.entities.find(e =>
      ship.components.shipSystems?.shipSystems.has(e.id)
    );
    const mass = ship.components.mass?.mass || 1;

    let {thrust, targetSpeed, cruisingSpeed} =
      entity.components.isImpulseEngines;

    if (entity.components.power) {
      const {currentPower, maxSafePower, requiredPower} =
        entity.components.power || {};
      targetSpeed =
        cruisingSpeed *
        ((currentPower - requiredPower) / (maxSafePower - requiredPower));
    }

    const appliedThrust = (targetSpeed / cruisingSpeed) * thrust;

    let acceleration = appliedThrust / mass;
    if (!entity.components.isImpulseEngines.targetSpeed) {
      acceleration = 0;
    }
    const warpForwardVelocity = warp?.components.isWarpEngines?.forwardVelocity;
    if (
      warpForwardVelocity &&
      warpForwardVelocity > entity.components.isImpulseEngines.emergencySpeed
    ) {
      // Set the impulse forward velocity to the warp forward velocity so we don't have to accelerate from nothing
      entity.updateComponent("isImpulseEngines", {
        forwardVelocity: Math.max(
          warpForwardVelocity,
          entity.components.isImpulseEngines.emergencySpeed
        ),
      });
    }

    if (
      entity.components.isImpulseEngines.forwardVelocity >
      entity.components.isImpulseEngines.targetSpeed
    ) {
      // Slow down
      acceleration =
        entity.components.isImpulseEngines.forwardVelocity *
        SOFT_BRAKE_CONST *
        -1;
    }

    entity.updateComponent("isImpulseEngines", {
      forwardAcceleration: acceleration,
    });

    if (!entity.components.isImpulseEngines.forwardVelocity)
      entity.components.isImpulseEngines.forwardVelocity = 0;
    if (
      entity.components.isImpulseEngines.forwardVelocity +
        entity.components.isImpulseEngines.forwardAcceleration * elapsedRatio <
        entity.components.isImpulseEngines.targetSpeed ||
      entity.components.isImpulseEngines.forwardAcceleration < 0
    ) {
      entity.components.isImpulseEngines.forwardVelocity +=
        entity.components.isImpulseEngines.forwardAcceleration * elapsedRatio;
    }

    if (entity.components.isImpulseEngines.forwardVelocity < 0.000001) {
      entity.components.isImpulseEngines.forwardVelocity = 0;
    }
  }
}

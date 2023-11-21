import {Entity, System} from "../utils/ecs";

const PEDAL_TO_THE_METAL_CONST = 10;
const HARD_BRAKE_CONST = 5;
const SOFT_BRAKE_CONST = 5;

export class WarpSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.isWarpEngines && entity.components.isShipSystem
    );
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;
    const ship = this.ecs.entities.find(e =>
      e.components.shipSystems?.shipSystems.has(entity.id)
    );
    if (!ship || !ship.components.isShip || !entity.components.isWarpEngines)
      return;

    const {isWarpEngines: warp} = entity.components;
    const {
      interstellarCruisingSpeed,
      solarCruisingSpeed,
      minSpeedMultiplier,
      currentWarpFactor,
      warpFactorCount,
    } = entity.components.isWarpEngines;

    const cruisingSpeed =
      ship.components.position?.type === "interstellar"
        ? interstellarCruisingSpeed
        : solarCruisingSpeed;

    const minWarp = cruisingSpeed * minSpeedMultiplier;

    // Calculate max warp speed based on the factor and the number of warp factors
    let warpSpeed = 0;
    if (currentWarpFactor === 1) {
      warpSpeed = minWarp;
    } else if (currentWarpFactor > 1) {
      warpSpeed =
        (cruisingSpeed - minWarp) *
        ((currentWarpFactor - 1) / (warpFactorCount - 1));
    }

    // Calculate max warp speed based on the factor and the number of warp factors
    let forwardVelocity = warp.forwardVelocity ?? 0;
    let forwardAcceleration = warp.forwardAcceleration ?? 0;
    let maxVelocity = warp.maxVelocity ?? 0;

    if (forwardVelocity > warpSpeed) {
      // Slow the ship down
      // Rapidly slow the ship down so we don't cross too much space as we decelerate.
      if (warpSpeed === 0 && forwardVelocity > minWarp) {
        forwardVelocity = minWarp / HARD_BRAKE_CONST;
      }
      forwardAcceleration = forwardVelocity * SOFT_BRAKE_CONST * -1;
    } else {
      // Calculate acceleration based on warp speed
      forwardAcceleration = warpSpeed / PEDAL_TO_THE_METAL_CONST;
    }
    maxVelocity = warpSpeed;

    // Accelerate until we hit the max velocity
    if (
      forwardVelocity + forwardAcceleration * elapsedRatio < maxVelocity ||
      forwardAcceleration < 0
    ) {
      forwardVelocity += forwardAcceleration * elapsedRatio;
    } else if (
      forwardVelocity + forwardAcceleration * elapsedRatio >
      maxVelocity
    ) {
      forwardVelocity = maxVelocity;
    }

    // Or stop the ship entirely once we slow to a certain point
    if (forwardVelocity < 0.0000001) {
      forwardVelocity = 0;
      if (warpSpeed === 0) {
        forwardAcceleration = 0;
      }
    }

    entity.updateComponent("isWarpEngines", {
      forwardVelocity,
      maxVelocity,
      forwardAcceleration,
    });
  }
}

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
      e.components.shipSystems?.shipSystemIds.includes(entity.id)
    );
    if (!ship || !ship.components.isShip || !entity.components.isWarpEngines)
      return;

    const {isWarpEngines: warp} = entity.components;
    const {
      interstellarCruisingSpeed,
      solarCruisingSpeed,
      minSpeedMultiplier,
      maxVelocity,
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
    warp.forwardVelocity = warp.forwardVelocity ?? 0;

    if (warp.forwardVelocity > warpSpeed) {
      // Slow the ship down
      // Rapidly slow the ship down so we don't cross too much space as we decelerate.
      if (warpSpeed === 0 && warp.forwardVelocity > minWarp) {
        warp.forwardVelocity = minWarp / HARD_BRAKE_CONST;
      }
      warp.forwardAcceleration = warp.forwardVelocity * SOFT_BRAKE_CONST * -1;
    } else {
      // Calculate acceleration based on warp speed
      warp.forwardAcceleration = warpSpeed / PEDAL_TO_THE_METAL_CONST;
    }
    warp.maxVelocity = warpSpeed;

    // Accelerate until we hit the max velocity
    if (
      warp.forwardVelocity + warp.forwardAcceleration * elapsedRatio <
        warp.maxVelocity ||
      warp.forwardAcceleration < 0
    ) {
      warp.forwardVelocity += warp.forwardAcceleration * elapsedRatio;
    } else if (
      warp.forwardVelocity + warp.forwardAcceleration * elapsedRatio >
      warp.maxVelocity
    ) {
      warp.forwardVelocity = warp.maxVelocity;
    }

    // Or stop the ship entirely once we slow to a certain point
    if (warp.forwardVelocity < 0.0000001) {
      warp.forwardVelocity = 0;
      if (warpSpeed === 0) {
        warp.forwardAcceleration = 0;
      }
    }
  }
}

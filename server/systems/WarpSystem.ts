import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";

const PEDAL_TO_THE_METAL_CONST = 10;
const HARD_BRAKE_CONST = 5;
const SOFT_BRAKE_CONST = 5;

export class WarpSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.warpEngines &&
      entity.components.isOutfit &&
      entity.components.shipAssignment?.shipId
    );
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;
    const ship = this.ecs.entities.find(
      e => e.id === entity.components.shipAssignment?.shipId
    );
    if (!ship || !ship.isShip || !entity.warpEngines) return;

    const {
      interstellarCruisingSpeed,
      planetaryCruisingSpeed,
      minSpeedMultiplier,
      warpFactorCount,
      currentWarpFactor,
    } = entity.warpEngines;

    const cruisingSpeed =
      ship.interstellarPosition?.systemId === null
        ? interstellarCruisingSpeed
        : planetaryCruisingSpeed;

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

    if (entity.warpEngines.forwardVelocity > warpSpeed) {
      // Slow the ship down
      // Rapidly slow the ship down so we don't cross too much space as we decelerate.
      if (warpSpeed === 0 && entity.warpEngines.forwardVelocity > minWarp) {
        entity.warpEngines.forwardVelocity = minWarp / HARD_BRAKE_CONST;
      }
      entity.warpEngines.forwardAcceleration =
        entity.warpEngines.forwardVelocity * SOFT_BRAKE_CONST * -1;
    } else {
      // Calculate acceleration based on warp speed
      entity.warpEngines.forwardAcceleration =
        warpSpeed / PEDAL_TO_THE_METAL_CONST;
    }
    entity.warpEngines.maxVelocity = warpSpeed;

    if (
      entity.warpEngines.forwardVelocity +
        entity.warpEngines.forwardAcceleration * elapsedRatio <
        entity.warpEngines.maxVelocity ||
      entity.warpEngines.forwardAcceleration < 0
    ) {
      entity.warpEngines.forwardVelocity +=
        entity.warpEngines.forwardAcceleration * elapsedRatio;
    }

    if (entity.warpEngines.forwardVelocity < 0.000000001) {
      entity.warpEngines.forwardVelocity = 0;
      if (warpSpeed === 0) {
        entity.warpEngines.forwardAcceleration = 0;
      }
    }
  }
}

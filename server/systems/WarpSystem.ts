import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";

export class WarpSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.warpEngines &&
      entity.components.isOutfit &&
      entity.components.shipAssignment?.shipId
    );
  }
  update(entity: Entity, elapsed: number) {
    if (!entity.warpEngines) return;

    // TODO: Figure out if we are in interstellar or planetary space
    const {
      interstellarCruisingSpeed,
      planetaryCruisingSpeed,
      minSpeedMultiplier,
      warpFactorCount,
      currentWarpFactor,
    } = entity.warpEngines;

    const cruisingSpeed = planetaryCruisingSpeed;

    const minWarp = cruisingSpeed / minSpeedMultiplier;
    let warpSpeed = 0;
    if (currentWarpFactor === 1) {
      warpSpeed = minWarp;
    } else if (currentWarpFactor > 1) {
      warpSpeed =
        (cruisingSpeed - minWarp) *
        ((currentWarpFactor - 1) / (warpFactorCount - 1));
    }
    entity.warpEngines.maxVelocity = warpSpeed;
    entity.warpEngines.forwardAcceleration = warpSpeed / 10;
  }
}

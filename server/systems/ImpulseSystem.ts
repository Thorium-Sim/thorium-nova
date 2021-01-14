import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";

const SOFT_BRAKE_CONST = 5;

export class ImpulseSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.impulseEngines &&
      entity.components.isOutfit &&
      entity.components.shipAssignment?.shipId
    );
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;

    const ship = this.ecs.entities.find(
      e => e.id === entity.components.shipAssignment?.shipId
    );
    if (!ship || !ship.isShip || !entity.impulseEngines) return;
    const {mass} = ship.isShip;

    const {thrust, targetSpeed, cruisingSpeed} = entity.impulseEngines;
    const appliedThrust = (targetSpeed / cruisingSpeed) * thrust;

    let acceleration = appliedThrust / mass;
    if (!entity.impulseEngines.targetSpeed) {
      acceleration = 0;
    }
    if (
      entity.impulseEngines.forwardVelocity > entity.impulseEngines.targetSpeed
    ) {
      // Slow down
      acceleration =
        entity.impulseEngines.forwardVelocity * SOFT_BRAKE_CONST * -1;
    }

    entity.updateComponent("impulseEngines", {
      forwardAcceleration: acceleration,
    });

    if (!entity.impulseEngines.forwardVelocity)
      entity.impulseEngines.forwardVelocity = 0;
    if (
      entity.impulseEngines.forwardVelocity +
        entity.impulseEngines.forwardAcceleration * elapsedRatio <
        entity.impulseEngines.targetSpeed ||
      entity.impulseEngines.forwardAcceleration < 0
    ) {
      entity.impulseEngines.forwardVelocity +=
        entity.impulseEngines.forwardAcceleration * elapsedRatio;
    }

    if (entity.impulseEngines.forwardVelocity < 0.000001) {
      entity.impulseEngines.forwardVelocity = 0;
    }
  }
}

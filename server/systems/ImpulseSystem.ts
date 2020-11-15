import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";

export class ImpulseSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.impulseEngines &&
      entity.components.isOutfit &&
      entity.components.shipAssignment?.shipId
    );
  }
  update(entity: Entity) {
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
    entity.updateComponent("impulseEngines", {
      forwardAcceleration: acceleration,
    });
  }
}

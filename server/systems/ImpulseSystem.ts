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
    const ship = entity.components.shipAssignment?.ship;
    if (!ship || !ship.isShip || !entity.impulseEngines) return;
    const {mass} = ship.isShip;

    let acceleration = entity.impulseEngines.thrust / mass;
    if (!entity.impulseEngines.targetSpeed) {
      acceleration = 0;
    }

    entity.updateComponent("impulseEngines", {
      forwardAcceleration: acceleration,
    });
  }
}

import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";

export class ThrusterSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.thrusters &&
      entity.components.isOutfit &&
      entity.components.shipAssignment?.shipId
    );
  }
  update(entity: Entity, elapsed: number) {
    const ship = this.ecs.entities.find(
      e => e.id === entity.components.shipAssignment?.shipId
    );
    if (!ship || !ship.isShip || !entity.thrusters) return;
    const {mass} = ship.isShip;

    const {direction, directionThrust} = entity.thrusters;

    entity.thrusters.directionAcceleration = {
      x: (direction.x * directionThrust) / mass,
      y: (direction.y * directionThrust) / mass,
      z: (direction.z * directionThrust) / mass,
    };

    // Thruster rotation is entirely handled by the rotation system.
  }
}

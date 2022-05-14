import {Entity, System} from "../utils/ecs";

export class ThrusterSystem extends System {
  test(entity: Entity) {
    return !!(entity.components.isThrusters && entity.components.isShipSystem);
  }
  update(entity: Entity, elapsed: number) {
    const ship = this.ecs.entities.find(e =>
      e.components.shipSystems?.shipSystemIds.includes(entity.id)
    );
    if (!ship || !ship.components.isShip || !entity.components.isThrusters)
      return;

    const mass = ship.components.mass?.mass || 1;

    const {direction, directionThrust} = entity.components.isThrusters;

    entity.updateComponent("isThrusters", {
      directionAcceleration: {
        x: (direction.x * directionThrust) / mass,
        y: (direction.y * directionThrust) / mass,
        z: (direction.z * directionThrust) / mass,
      },
    });

    // Thruster rotation is entirely handled by the rotation system.
  }
}

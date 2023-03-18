import {Entity, System} from "../utils/ecs";

export class ThrusterSystem extends System {
  test(entity: Entity) {
    return !!(entity.components.isThrusters && entity.components.isShipSystem);
  }
  update(entity: Entity, elapsed: number) {
    const ship = this.ecs.entities.find(e =>
      e.components.shipSystems?.shipSystems.has(entity.id)
    );
    if (!ship || !ship.components.isShip || !entity.components.isThrusters)
      return;

    const mass = ship.components.mass?.mass || 1;

    const {direction, directionThrust} = entity.components.isThrusters;
    const currentPower = entity.components.power?.currentPower || 1;
    const maxSafePower = entity.components.power?.maxSafePower || 1;
    const requiredPower = entity.components.power?.requiredPower || 1;
    const powerRatio = currentPower / maxSafePower;
    let thrust =
      currentPower > requiredPower ? directionThrust * powerRatio : 0;
    entity.updateComponent("isThrusters", {
      directionAcceleration: {
        x: (direction.x * thrust) / mass,
        y: (direction.y * thrust) / mass,
        z: (direction.z * thrust) / mass,
      },
    });

    // Thruster rotation is entirely handled by the rotation system.
  }
}

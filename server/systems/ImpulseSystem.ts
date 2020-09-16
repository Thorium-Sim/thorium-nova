import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Quaternion, Vector3} from "three";

export class ImpulseSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.impulseEngines &&
      entity.components.isOutfit &&
      entity.components.isOutfit.assignedShip
    );
  }
  update(entity: Entity, elapsed: number) {
    const ship = entity.components.isOutfit?.assignedShip;
    if (!ship || !ship.isShip || !entity.impulseEngines) return;
    const {mass} = ship.isShip;

    let acceleration = (entity.impulseEngines.thrust / mass) * elapsed;

    // This if block creates the exponential acceleration
    if (ship.velocity && ship.rotation) {
      const {x, y, z} = ship.velocity;
      const velocity = new Vector3(x, y, z);
      const {x: rx, y: ry, z: rz, w} = ship.rotation;
      const rotation = new Quaternion(rx, ry, rz, w);
      const vec = new Vector3(0, 0, 1);
      vec.applyQuaternion(rotation).normalize();
      const forwardVelocity = vec.multiply(velocity).length();
      acceleration = acceleration * forwardVelocity + acceleration;
    }
    entity.updateComponent("impulseEngines", {
      forwardAcceleration: acceleration,
    });
  }
}

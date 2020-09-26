import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Quaternion, Vector3} from "three";

export class ImpulseSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.impulseEngines &&
      entity.components.isOutfit &&
      entity.components.shipAssignment?.shipId
    );
  }
  update(entity: Entity, elapsed: number) {
    const ship = entity.components.shipAssignment?.ship;
    if (!ship || !ship.isShip || !entity.impulseEngines) return;
    const {mass} = ship.isShip;

    let acceleration = (entity.impulseEngines.thrust / mass) * elapsed;
    if (ship.velocity && ship.rotation) {
      // This if block creates the exponential acceleration
      const {x, y, z} = ship.velocity;
      const velocity = new Vector3(x, y, z);
      const {x: rx, y: ry, z: rz, w} = ship.rotation;
      const rotation = new Quaternion(rx, ry, rz, w);
      const vec = new Vector3(0, 1, 0);
      vec.applyQuaternion(rotation).normalize();
      const forwardVelocity = vec.multiply(velocity).length();
      if (forwardVelocity < entity.impulseEngines.targetSpeed) {
        acceleration = acceleration * forwardVelocity + acceleration;
      } else if (forwardVelocity > entity.impulseEngines.targetSpeed) {
        acceleration = acceleration * forwardVelocity * -1 - acceleration;
      } else {
        acceleration = 0;
      }
    }
    entity.updateComponent("impulseEngines", {
      forwardAcceleration: acceleration,
    });
  }
}

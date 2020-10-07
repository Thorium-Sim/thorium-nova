import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Object3D, Quaternion, Vector3} from "three";

const velocityObject = new Object3D();
const forwardVector = new Vector3();
export class EngineVelocitySystem extends System {
  test(entity: Entity) {
    return !!(entity.components.isShip && entity.components.velocity);
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;

    const systems = this.ecs.entities.filter(
      s =>
        s.shipAssignment?.shipId === entity.id &&
        (s.impulseEngines || s.thrusters || s.dampener)
    );
    if (!entity.velocity || !entity.rotation || !entity.position) return;
    const velocity = entity.velocity;

    // Apply dampening, then apply engines
    const velocityVector = new Vector3(velocity.x, velocity.y, velocity.z);
    const dampening = entity.dampener?.dampening;
    if (dampening) {
      // Create an opposite vector
      const dampeningVector = new Vector3(
        Math.sign(velocityVector.x) * -1 * dampening * elapsedRatio,
        Math.sign(velocityVector.y) * -1 * dampening * elapsedRatio,
        Math.sign(velocityVector.z) * -1 * dampening * elapsedRatio
      );

      // Add it to the velocity to reverse it a bit
      velocityVector.add(dampeningVector);

      // If we ever cross 0 with our reversing, just set the value to 0
      entity.velocity.x =
        Math.sign(velocity.x) === Math.sign(velocityVector.x)
          ? velocityVector.x
          : 0;
      entity.velocity.x =
        Math.sign(velocity.y) === Math.sign(velocityVector.y)
          ? velocityVector.y
          : 0;
      entity.velocity.x =
        Math.sign(velocity.z) === Math.sign(velocityVector.z)
          ? velocityVector.z
          : 0;
    }

    // Use THREEJS to do some translation magic.
    velocityObject.rotation.setFromQuaternion(
      new Quaternion(
        entity.rotation.x,
        entity.rotation.y,
        entity.rotation.z,
        entity.rotation.w
      )
    );
    velocityObject.position.set(
      entity.velocity.x,
      entity.velocity.y,
      entity.velocity.z
    );

    // Warp Engines are handled separately, with the WarpVelocityPosition system

    const forwardVelocity = velocityObject.position.dot(
      forwardVector
        .set(0, 1, 0)
        .applyQuaternion(
          new Quaternion(
            entity.rotation.x,
            entity.rotation.y,
            entity.rotation.z,
            entity.rotation.w
          )
        )
    );

    // Impulse Engines
    const impulse = systems?.find(s => s.impulseEngines);
    if (impulse?.impulseEngines) {
      if (forwardVelocity < impulse.impulseEngines.targetSpeed) {
        velocityObject.translateY(
          impulse.impulseEngines.forwardAcceleration * elapsedRatio
        );
      }
    }
    // Thrusters
    const thrusters = systems?.find(s => s.thrusters);

    if (thrusters?.thrusters?.directionAcceleration) {
      // Measured in m/s/s, so divide by 1000
      velocityObject.translateX(
        thrusters.thrusters.directionAcceleration.x * elapsedRatio * (1 / 1000)
      );
      velocityObject.translateY(
        thrusters.thrusters.directionAcceleration.y * elapsedRatio * (1 / 1000)
      );
      velocityObject.translateZ(
        thrusters.thrusters.directionAcceleration.z * elapsedRatio * (1 / 1000)
      );
    }

    entity.velocity.x = velocityObject.position.x;
    entity.velocity.y = velocityObject.position.y;
    entity.velocity.z = velocityObject.position.z;
  }
}

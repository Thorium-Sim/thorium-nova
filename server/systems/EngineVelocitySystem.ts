import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Object3D, Quaternion, Vector3} from "three";

const velocityObject = new Object3D();
const forwardVector = new Vector3();
const shipRotationQuaternion = new Quaternion();
const accelerationVector = new Vector3();

const ACCELERATION_MASS_DAMPENING = 3;
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

    shipRotationQuaternion.set(
      entity.rotation.x,
      entity.rotation.y,
      entity.rotation.z,
      entity.rotation.w
    );

    // Use THREEJS to do some translation magic.
    velocityObject.rotation.setFromQuaternion(shipRotationQuaternion);
    velocityObject.position.set(velocity.x, velocity.y, velocity.z);

    // Warp Engines are handled separately, with the WarpVelocityPosition system

    const forwardVelocity = velocityObject.position.dot(
      forwardVector.set(0, 1, 0).applyQuaternion(shipRotationQuaternion)
    );

    accelerationVector.set(0, 0, 0);

    // Use dampening to increase the acceleration of the ship at impulse
    const dampener = systems?.find(s => s.dampener);
    const dampening = dampener?.dampener?.dampening;
    // Impulse Engines
    const impulse = systems?.find(s => s.impulseEngines);
    if (impulse?.impulseEngines) {
      if (forwardVelocity < impulse.impulseEngines.targetSpeed) {
        const impulseAccel =
          impulse.impulseEngines.forwardAcceleration *
          elapsedRatio *
          (dampening ? (dampening + 1) * ACCELERATION_MASS_DAMPENING : 1);

        velocityObject.translateY(impulseAccel);
        accelerationVector.y = impulseAccel;
      }
    }
    // Thrusters
    const thrusters = systems?.find(s => s.thrusters);

    if (thrusters?.thrusters?.directionAcceleration) {
      // Measured in m/s/s, so divide by 1000
      const accelX =
        thrusters.thrusters.directionAcceleration.x * elapsedRatio * (1 / 1000);
      const accelY =
        thrusters.thrusters.directionAcceleration.y * elapsedRatio * (1 / 1000);
      const accelZ =
        thrusters.thrusters.directionAcceleration.z * elapsedRatio * (1 / 1000);

      velocityObject.translateX(accelX);
      velocityObject.translateY(accelY);
      velocityObject.translateZ(accelZ);

      accelerationVector.x = Math.abs(accelX);
      accelerationVector.y = Math.abs(accelerationVector.y + accelY);
      accelerationVector.z = Math.abs(accelZ);
    }

    accelerationVector
      .applyQuaternion(shipRotationQuaternion)
      .normalize()
      .sub(new Vector3(1, 1, 1))
      .negate();

    // Apply dampening
    if (dampening) {
      // Create an opposite vector, but eliminate anything that is not part of the acceleration
      const offsetDampening = dampening / 100 + 1;
      const dampeningRatio = (-1 / offsetDampening) * elapsedRatio;
      const dampeningVector = new Vector3(
        velocityObject.position.x * dampeningRatio,
        velocityObject.position.y * dampeningRatio,
        velocityObject.position.z * dampeningRatio
      ).multiply(accelerationVector);

      // Add it to the velocity to reverse it a bit
      velocityObject.position.add(dampeningVector);

      // If we ever cross 0 with our reversing, just set the value to 0
      velocityObject.position.x =
        Math.sign(velocity.x) === Math.sign(velocityObject.position.x) ||
        velocity.x === 0
          ? velocityObject.position.x
          : 0;
      velocityObject.position.y =
        Math.sign(velocity.y) === Math.sign(velocityObject.position.y) ||
        velocity.y === 0
          ? velocityObject.position.y
          : 0;
      velocityObject.position.z =
        Math.sign(velocity.z) === Math.sign(velocityObject.position.z) ||
        velocity.z === 0
          ? velocityObject.position.z
          : 0;
    }

    entity.velocity.x = Math.round(velocityObject.position.x * 10000) / 10000;
    entity.velocity.y = Math.round(velocityObject.position.y * 10000) / 10000;
    entity.velocity.z = Math.round(velocityObject.position.z * 10000) / 10000;
  }
}

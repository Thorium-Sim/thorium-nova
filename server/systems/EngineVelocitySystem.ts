import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Object3D, Quaternion, Vector3} from "three";

const velocityObject = new Object3D();
const shipRotationQuaternion = new Quaternion();
const accelerationVector = new Vector3();
const oppositeAcceleration = new Vector3();
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

    // Warp Engines and impulse engines are handled separately, with the EngineVelocityPosition system

    accelerationVector.set(0, 0, 0);

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

      accelerationVector.x = accelerationVector.x + accelX;
      accelerationVector.y = accelerationVector.y + accelY;
      accelerationVector.z = accelerationVector.z + accelZ;
    }

    // Apply dampening
    const dampener = systems?.find(s => s.dampener);
    const dampening = dampener?.dampener?.dampening;
    if (dampening) {
      // Create an opposite vector, but eliminate anything that is not part of the acceleration
      const offsetDampening = dampening / 100 + 1;
      const dampeningRatio = (1 / offsetDampening) * elapsedRatio;
      accelerationVector.applyQuaternion(shipRotationQuaternion);
      oppositeAcceleration
        .set(
          Math.abs(accelerationVector.x),
          Math.abs(accelerationVector.y),
          Math.abs(accelerationVector.z)
        )
        .normalize()
        .subScalar(1)
        .multiplyScalar(dampeningRatio);

      oppositeAcceleration.x =
        velocityObject.position.x *
        (Math.sign(accelerationVector.x) ===
        Math.sign(velocityObject.position.x)
          ? 0
          : oppositeAcceleration.x);
      oppositeAcceleration.y =
        velocityObject.position.y *
        (Math.sign(accelerationVector.y) ===
        Math.sign(velocityObject.position.y)
          ? 0
          : oppositeAcceleration.y);
      oppositeAcceleration.z =
        velocityObject.position.z *
        (Math.sign(accelerationVector.z) ===
        Math.sign(velocityObject.position.z)
          ? 0
          : oppositeAcceleration.z);

      velocityObject.position.add(oppositeAcceleration);
    }

    entity.velocity.x =
      Math.round(velocityObject.position.x * 10000000) / 10000000;
    entity.velocity.y =
      Math.round(velocityObject.position.y * 10000000) / 10000000;
    entity.velocity.z =
      Math.round(velocityObject.position.z * 10000000) / 10000000;
  }
}

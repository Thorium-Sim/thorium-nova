import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Object3D, Quaternion, Vector3} from "three";

const velocityObject = new Object3D();
const forwardVector = new Vector3();
const shipRotationQuaternion = new Quaternion();
const accelerationVector = new Vector3();
const oppositeAcceleration = new Vector3();
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
      forwardVector.set(0, 0, 1).applyQuaternion(shipRotationQuaternion)
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

        velocityObject.translateZ(impulseAccel);
        accelerationVector.z = impulseAccel;
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

      accelerationVector.x = accelerationVector.x + accelX;
      accelerationVector.y = accelerationVector.y + accelY;
      accelerationVector.z = accelerationVector.z + accelZ;
    }

    // This needs a bit of fixing.
    // The issue at hand is that I'm only dampening on three axes: x,y,z
    // But what really needs to happen is a dampening on six axes: x,y,z,-x,-y,-z.
    // If I were to turn my ship around using the yaw thrusters, the system as it currently stands
    //  would require me to apply acceleration only using my engines, and not rely on the
    // inertial dampeners at all. That is not ideal.
    // Instead, it should only ignore the velocity of the ship going in a specific direction. So
    // if my acceleration is positive z, but my velocity is negative z, it should add to my positive
    // acceleration so the velocity gets back to zero as quickly as possible. I think
    // this will fix a number of issues that have been experienced.

    // Apply dampening
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

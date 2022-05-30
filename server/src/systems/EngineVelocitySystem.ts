import {Object3D, Quaternion, Vector3} from "three";
import {Entity, System} from "../utils/ecs";
import {M_TO_KM} from "../utils/unitTypes";

const velocityObject = new Object3D();
const shipRotationQuaternion = new Quaternion();
const accelerationVector = new Vector3();
const oppositeAcceleration = new Vector3();

function decreasePrecision(number: number) {
  return Math.round(number * 10000000) / 10000000;
}
export class EngineVelocitySystem extends System {
  test(entity: Entity) {
    return !!(entity.components.isShip && entity.components.velocity);
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;

    const [thrusters, dampener] = this.ecs.entities.reduce(
      (acc: [Entity | null, Entity | null], sysEntity) => {
        if (
          !acc[0] &&
          sysEntity.components.isThrusters &&
          entity.components.shipSystems?.shipSystemIds.includes(sysEntity.id)
        )
          return [sysEntity, acc[1]];
        if (
          !acc[1] &&
          sysEntity.components.isInertialDampeners &&
          entity.components.shipSystems?.shipSystemIds.includes(sysEntity.id)
        )
          return [acc[0], sysEntity];
        return acc;
      },
      [null, null]
    );
    if (
      !entity.components.velocity ||
      !entity.components.rotation ||
      !entity.components.position
    )
      return;
    const velocity = entity.components.velocity;

    shipRotationQuaternion.set(
      entity.components.rotation.x,
      entity.components.rotation.y,
      entity.components.rotation.z,
      entity.components.rotation.w
    );

    // Use THREEJS to do some translation magic.
    velocityObject.rotation.setFromQuaternion(shipRotationQuaternion);
    velocityObject.position.set(velocity.x, velocity.y, velocity.z);

    // Warp Engines and impulse engines are handled separately, with the EngineVelocityPosition system

    accelerationVector.set(0, 0, 0);

    // Thrusters

    if (thrusters?.components.isThrusters?.directionAcceleration) {
      // Measured in m/s/s, so divide by 1000
      const accelX =
        thrusters.components.isThrusters.directionAcceleration.x *
        elapsedRatio *
        M_TO_KM;
      const accelY =
        thrusters.components.isThrusters.directionAcceleration.y *
        elapsedRatio *
        M_TO_KM;
      const accelZ =
        thrusters.components.isThrusters.directionAcceleration.z *
        elapsedRatio *
        M_TO_KM;

      velocityObject.translateX(accelX);
      velocityObject.translateY(accelY);
      velocityObject.translateZ(accelZ);

      accelerationVector.x = accelerationVector.x + accelX;
      accelerationVector.y = accelerationVector.y + accelY;
      accelerationVector.z = accelerationVector.z + accelZ;
    }

    // Apply dampening
    const dampening = dampener?.components.isInertialDampeners?.dampening;
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

    entity.updateComponent("velocity", {
      x: decreasePrecision(velocityObject.position.x),
      y: decreasePrecision(velocityObject.position.y),
      z: decreasePrecision(velocityObject.position.z),
    });
  }
}

import {Euler, Quaternion, Vector3} from "three";
import {Entity, System} from "../utils/ecs";

function oppositeVectorUnit(vectorUnit: number) {
  return (Math.sign(vectorUnit) || -1) * (Math.abs(vectorUnit) - 1);
}

const rotationAcceleration = new Vector3();
const rotationVelocityVector = new Vector3();
const velocityEuler = new Euler();
const velocityQuaternion = new Quaternion();
export class RotationSystem extends System {
  test(entity: Entity) {
    return !!(entity.components.isShip && entity.components.rotation);
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;
    const mass = entity.components.mass?.mass || 1;
    const [thrusters, dampener] = this.ecs.entities.reduce(
      (acc: [Entity | null, Entity | null], sysEntity) => {
        if (
          !acc[0] &&
          sysEntity.components.isThrusters &&
          entity.components.shipSystems?.shipSystems.has(sysEntity.id)
        )
          return [sysEntity, acc[1]];

        if (
          !acc[1] &&
          sysEntity.components.isInertialDampeners &&
          entity.components.shipSystems?.shipSystems.has(sysEntity.id)
        )
          return [acc[0], sysEntity];
        return acc;
      },
      [null, null]
    );
    if (!entity.components.rotation) return;
    const rotation = entity.components.rotation;

    // Apply dampening, then apply engines
    const quaternion = new Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );
    // Thrusters

    if (thrusters?.components.isThrusters) {
      const {
        rotationDelta,
        rotationMaxSpeed,
        rotationThrust,
        rotationVelocity,
      } = thrusters.components.isThrusters;

      rotationAcceleration.set(
        ((rotationDelta.x * rotationThrust) / (mass * 20)) * elapsedRatio,
        ((rotationDelta.y * rotationThrust) / (mass * 20)) * elapsedRatio,
        ((rotationDelta.z * rotationThrust) / (mass * 20)) * elapsedRatio
      );

      const revolutionsPerSecond = rotationMaxSpeed / 60;
      const maxRadiansPerSecond = revolutionsPerSecond * (Math.PI * 2);

      rotationVelocity.x = Math.min(
        maxRadiansPerSecond * Math.abs(rotationDelta.x),
        Math.max(
          -1 * maxRadiansPerSecond * Math.abs(rotationDelta.x),
          rotationVelocity.x + rotationAcceleration.x
        )
      );
      rotationVelocity.y = Math.min(
        maxRadiansPerSecond * Math.abs(rotationDelta.y),
        Math.max(
          -1 * maxRadiansPerSecond * Math.abs(rotationDelta.y),
          rotationVelocity.y + rotationAcceleration.y
        )
      );
      rotationVelocity.z = Math.min(
        maxRadiansPerSecond * Math.abs(rotationDelta.z),
        Math.max(
          -1 * maxRadiansPerSecond * Math.abs(rotationDelta.z),
          rotationVelocity.z + rotationAcceleration.z
        )
      );

      const dampening = dampener?.components.isInertialDampeners?.dampening;
      if (dampening) {
        rotationAcceleration.normalize();
        const oppositeAcceleration = new Vector3(
          oppositeVectorUnit(rotationAcceleration.x),
          oppositeVectorUnit(rotationAcceleration.y),
          oppositeVectorUnit(rotationAcceleration.z)
        );
        const offsetDampening = (dampening + 1) / 50;
        const dampeningRatio = (1 / offsetDampening) * elapsedRatio;
        const dampeningVector = new Vector3(
          rotationVelocity.x * dampeningRatio,
          rotationVelocity.y * dampeningRatio,
          rotationVelocity.z * dampeningRatio
        )
          .negate()
          .multiply(oppositeAcceleration);
        rotationVelocity.x += dampeningVector.x;
        rotationVelocity.y += dampeningVector.y;
        rotationVelocity.z += dampeningVector.z;
      }
      rotationVelocityVector.set(
        rotationVelocity.x * elapsedRatio,
        rotationVelocity.y * elapsedRatio,
        rotationVelocity.z * elapsedRatio
      );
      velocityEuler.setFromVector3(rotationVelocityVector);
      velocityQuaternion.setFromEuler(velocityEuler);
      quaternion.multiply(velocityQuaternion);
    }
    entity.updateComponent("rotation", {
      x: quaternion.x,
      y: quaternion.y,
      z: quaternion.z,
      w: quaternion.w,
    });
  }
}

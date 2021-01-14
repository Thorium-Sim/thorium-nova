import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Euler, Quaternion, Vector3} from "three";

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
    const mass = entity.isShip?.mass || 1;
    const systems = this.ecs.entities.filter(
      s => s.shipAssignment?.shipId === entity.id && (s.thrusters || s.dampener)
    );
    if (!entity.rotation) return;
    const rotation = entity.rotation;

    // Apply dampening, then apply engines
    const quaternion = new Quaternion(
      rotation.x,
      rotation.y,
      rotation.z,
      rotation.w
    );
    // Thrusters
    const thrusters = systems?.find(s => s.thrusters);

    if (thrusters?.thrusters) {
      const {
        rotationDelta,
        rotationMaxSpeed,
        rotationThrust,
        rotationVelocity,
      } = thrusters.thrusters;

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

      const dampener = systems?.find(s => s.dampener);
      const dampening = dampener?.dampener?.dampening;
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
    entity.rotation.x = quaternion.x;
    entity.rotation.y = quaternion.y;
    entity.rotation.z = quaternion.z;
    entity.rotation.w = quaternion.w;
  }
}

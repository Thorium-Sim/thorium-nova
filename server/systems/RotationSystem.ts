import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Euler, Quaternion, Vector3} from "three";

function unitVelocity(rv: number, dv: number) {
  return Math.sign(rv + dv) === Math.sign(rv) || rv === 0 ? rv + dv : 0;
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
        ((rotationDelta.x * rotationThrust) / mass) * elapsedRatio,
        ((rotationDelta.y * rotationThrust) / mass) * elapsedRatio,
        ((rotationDelta.z * rotationThrust) / mass) * elapsedRatio
      );

      const revolutionsPerSecond = rotationMaxSpeed / 60;
      const maxRadiansPerSecond = revolutionsPerSecond * (Math.PI * 2);

      rotationVelocity.x = Math.min(
        maxRadiansPerSecond,
        Math.max(
          -1 * maxRadiansPerSecond,
          rotationVelocity.x + rotationAcceleration.x
        )
      );
      rotationVelocity.y = Math.min(
        maxRadiansPerSecond,
        Math.max(
          -1 * maxRadiansPerSecond,
          rotationVelocity.y + rotationAcceleration.y
        )
      );
      rotationVelocity.z = Math.min(
        maxRadiansPerSecond,
        Math.max(
          -1 * maxRadiansPerSecond,
          rotationVelocity.z + rotationAcceleration.z
        )
      );

      const dampener = systems?.find(s => s.dampener);
      const dampening = dampener?.dampener?.dampening;
      if (dampening) {
        const accelerationVector = rotationAcceleration
          .normalize()
          .sub(new Vector3(1, 1, 1))
          .negate();
        const offsetDampening = dampening / 100 + 1;
        const dampeningRatio = (-1 / offsetDampening) * elapsedRatio;
        const dampeningVector = new Vector3(
          rotationVelocity.x * dampeningRatio,
          rotationVelocity.y * dampeningRatio,
          rotationVelocity.z * dampeningRatio
        ).multiply(accelerationVector);

        rotationVelocity.x = unitVelocity(
          rotationVelocity.x,
          dampeningVector.x
        );
        rotationVelocity.y = unitVelocity(
          rotationVelocity.y,
          dampeningVector.y
        );
        rotationVelocity.z = unitVelocity(
          rotationVelocity.z,
          dampeningVector.z
        );
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

import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Euler, Quaternion} from "three";

export class RotationSystem extends System {
  test(entity: Entity) {
    return !!(entity.components.isShip && entity.components.rotation);
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;

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

    if (thrusters?.thrusters?.rotationVelocity) {
      const velocityQuaternion = new Quaternion().setFromEuler(
        new Euler(
          thrusters.thrusters?.rotationVelocity.x * elapsedRatio,
          thrusters.thrusters?.rotationVelocity.y * elapsedRatio,
          thrusters.thrusters?.rotationVelocity.z * elapsedRatio
        )
      );
      quaternion.multiply(velocityQuaternion);
    }
    entity.rotation.x = quaternion.x;
    entity.rotation.y = quaternion.y;
    entity.rotation.z = quaternion.z;
    entity.rotation.w = quaternion.w;
  }
}

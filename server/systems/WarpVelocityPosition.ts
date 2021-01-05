import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Object3D, Quaternion} from "three";

const velocityObject = new Object3D();
export class WarpVelocityPosition extends System {
  test(entity: Entity) {
    return !!(
      entity.components.isShip &&
      entity.components.velocity &&
      entity.components.position &&
      entity.components.rotation
    );
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;

    const systems = this.ecs.entities.filter(
      s => s.shipAssignment?.shipId === entity.id && s.warpEngines
    );
    if (!entity.velocity || !entity.rotation || !entity.position) return;

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
    const warpEngines = systems.find(s => s.warpEngines);

    if (warpEngines && warpEngines.warpEngines?.forwardVelocity) {
      velocityObject.translateZ(warpEngines.warpEngines.forwardVelocity);
      entity.position.x += velocityObject.position.x * elapsedRatio;
      entity.position.y += velocityObject.position.y * elapsedRatio;
      entity.position.z += velocityObject.position.z * elapsedRatio;
    }
  }
}

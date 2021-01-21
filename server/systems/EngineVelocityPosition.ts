import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Object3D, Quaternion} from "three";

const velocityObject = new Object3D();
const KM_TO_LY = 1 / 9460730777119.56;
export class EngineVelocityPosition extends System {
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
    const interstellarMultiplier = entity.interstellarPosition?.systemId
      ? 1
      : KM_TO_LY;
    const systems = this.ecs.entities.filter(
      s =>
        s.shipAssignment?.shipId === entity.id &&
        (s.warpEngines || s.impulseEngines)
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
    velocityObject.position.set(0, 0, 0);
    const warpEngines = systems.find(s => s.warpEngines);
    const impulseEngines = systems.find(s => s.impulseEngines);
    // Warp engines override impulse engines
    if (warpEngines && warpEngines.warpEngines?.forwardVelocity) {
      velocityObject.translateZ(
        warpEngines.warpEngines.forwardVelocity * interstellarMultiplier
      );
    } else if (
      impulseEngines &&
      impulseEngines.impulseEngines?.forwardVelocity
    ) {
      velocityObject.translateZ(
        impulseEngines.impulseEngines.forwardVelocity * interstellarMultiplier
      );
    }

    entity.position.x += velocityObject.position.x * elapsedRatio;
    entity.position.y += velocityObject.position.y * elapsedRatio;
    entity.position.z += velocityObject.position.z * elapsedRatio;
  }
}

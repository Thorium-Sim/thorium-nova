import {Object3D, Quaternion} from "three";
import {Entity, System} from "../utils/ecs";
import {KM_TO_LM, KM_TO_LY} from "../utils/unitTypes";

const velocityObject = new Object3D();
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
    const interstellarMultiplier =
      entity.components.position?.type === "solar" ? 1 : KM_TO_LM;
    const [impulseEngines, warpEngines] = this.ecs.entities.reduce(
      (acc: [Entity | null, Entity | null], sysEntity) => {
        if (
          !acc[0] &&
          sysEntity.components.isImpulseEngines &&
          entity.components.shipSystems?.shipSystems.has(sysEntity.id)
        )
          return [sysEntity, acc[1]];
        if (
          !acc[1] &&
          sysEntity.components.isWarpEngines &&
          entity.components.shipSystems?.shipSystems.has(sysEntity.id)
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

    // Use THREEJS to do some translation magic.
    velocityObject.rotation.setFromQuaternion(
      new Quaternion(
        entity.components.rotation.x,
        entity.components.rotation.y,
        entity.components.rotation.z,
        entity.components.rotation.w
      )
    );
    velocityObject.position.set(0, 0, 0);
    // Warp engines override impulse engines
    if (warpEngines && warpEngines.components.isWarpEngines?.forwardVelocity) {
      velocityObject.translateZ(
        warpEngines.components.isWarpEngines.forwardVelocity *
          interstellarMultiplier
      );
    } else if (
      impulseEngines &&
      impulseEngines.components.isImpulseEngines?.forwardVelocity
    ) {
      velocityObject.translateZ(
        impulseEngines.components.isImpulseEngines.forwardVelocity *
          interstellarMultiplier
      );
    }

    const {x, y, z} = entity.components.position;
    entity.updateComponent("position", {
      x: x + velocityObject.position.x * elapsedRatio,
      y: y + velocityObject.position.y * elapsedRatio,
      z: z + velocityObject.position.z * elapsedRatio,
    });
  }
}

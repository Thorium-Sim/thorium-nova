import App from "server/app";
import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";
import {Object3D, Quaternion, Vector3} from "three";

const o = new Object3D();
export class EngineVelocitySystem extends System {
  test(entity: Entity) {
    return !!(entity.components.isShip && entity.components.velocity);
  }
  update(entity: Entity, elapsed: number) {
    const systems = App.activeFlight?.ecs.entities.filter(
      s =>
        s.isOutfit?.assignedShipId === entity.id &&
        (s.warpEngines || s.impulseEngines || s.thrusters || s.dampener)
    );
    if (!entity.velocity || !entity.rotation || !entity.position) return;
    const velocity = entity.velocity;

    // Apply dampening, then apply engines
    const velocityVector = new Vector3(velocity.x, velocity.y, velocity.z);
    const dampening = systems?.find(s => s.dampener)?.dampener?.dampening;
    if (dampening) {
      // Create an opposite vector
      const dampeningVector = new Vector3(
        Math.sign(velocityVector.x) * -1 * dampening * elapsed,
        Math.sign(velocityVector.y) * -1 * dampening * elapsed,
        Math.sign(velocityVector.z) * -1 * dampening * elapsed
      );

      // Add it to the velocity to reverse it a bit
      velocityVector.add(dampeningVector);

      // If we ever cross 0 with our reversing, just set the value to 0
      entity.velocity.x =
        Math.sign(velocity.x) === Math.sign(velocityVector.x)
          ? velocityVector.x
          : 0;
      entity.velocity.x =
        Math.sign(velocity.y) === Math.sign(velocityVector.y)
          ? velocityVector.y
          : 0;
      entity.velocity.x =
        Math.sign(velocity.z) === Math.sign(velocityVector.z)
          ? velocityVector.z
          : 0;
    }

    // Use THREEJS to do some translation magic.
    o.rotation.setFromQuaternion(
      new Quaternion(
        entity.rotation.x,
        entity.rotation.y,
        entity.rotation.z,
        entity.rotation.w
      )
    );
    o.position.set(entity.velocity.x, entity.velocity.y, entity.velocity.z);

    // Impulse Engines
    const impulse = systems?.find(s => s.impulseEngines);
    if (impulse?.impulseEngines) {
      o.translateY(impulse.impulseEngines.forwardAcceleration * elapsed);
      if (impulse.impulseEngines.targetSpeed) {
        o.position.clampLength(0, impulse.impulseEngines.targetSpeed);
      }
    }
    // Warp Engines
    const warp = systems?.find(s => s.warpEngines);
    if (warp?.warpEngines) {
      o.translateY(warp.warpEngines.forwardAcceleration * elapsed);
      if (warp.warpEngines.maxVelocity) {
        o.position.clampLength(0, warp.warpEngines.maxVelocity);
      }
    }
    // TODO: Thrusters

    entity.velocity.x = o.position.x;
    entity.velocity.y = o.position.y;
    entity.velocity.z = o.position.z;
  }
}

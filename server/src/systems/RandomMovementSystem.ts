import {Entity, System} from "../utils/ecs";

export class RandomMovementSystem extends System {
  test(entity: Entity) {
    return !!(entity.components.position && entity.components.velocity);
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;
    if (!entity.components.velocity) return;
    if (!entity.components.position) return;
    const xSign = entity.components.position.x > 0 ? -1 : 1;
    const ySign = entity.components.position.y > 0 ? -1 : 1;
    const zSign = entity.components.position.z > 0 ? -1 : 1;
    const accelerationX = Math.random() * xSign;
    const accelerationY = Math.random() * ySign;
    const accelerationZ = Math.random() * zSign;
    entity.components.velocity.x += accelerationX;
    entity.components.velocity.y += accelerationY;
    entity.components.velocity.z += accelerationZ;

    entity.components.position.x += entity.components.velocity.x * elapsedRatio;
    entity.components.position.y += entity.components.velocity.y * elapsedRatio;
    entity.components.position.z += entity.components.velocity.z * elapsedRatio;
  }
}

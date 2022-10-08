import {Entity, System} from "../utils/ecs";

export class PositionVelocitySystem extends System {
  test(entity: Entity) {
    return !!(entity.components.position && entity.components.velocity);
  }
  update(entity: Entity, elapsed: number) {
    const elapsedRatio = elapsed / 1000;
    if (!entity.components.velocity || !entity.components.position) return;
    entity.components.position.x += entity.components.velocity.x * elapsedRatio;
    entity.components.position.y += entity.components.velocity.y * elapsedRatio;
    entity.components.position.z += entity.components.velocity.z * elapsedRatio;
  }
}

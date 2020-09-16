import Entity from "server/helpers/ecs/entity";
import System from "server/helpers/ecs/system";

export class PositionVelocitySystem extends System {
  test(entity: Entity) {
    return !!(entity.components.position && entity.components.velocity);
  }
  update(entity: Entity, elapsed: number) {
    if (!entity.velocity || !entity.position) return;
    entity.position.x += entity.velocity.x * elapsed;
    entity.position.y += entity.velocity.y * elapsed;
    entity.position.z += entity.velocity.z * elapsed;
  }
}

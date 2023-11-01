import {getSectorNumber, getWorldPosition} from "@server/init/rapier";
import {Entity, System} from "@server/utils/ecs";
import {getOrbitPosition} from "@server/utils/getOrbitPosition";

export class PhysicsWorldPositionSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.physicsWorld &&
      (entity.components.position || entity.components.satellite)
    );
  }
  update(entity: Entity) {
    const position =
      entity.components.position ||
      (entity.components.satellite && {
        ...getOrbitPosition(entity.components.satellite),
        parentId: entity.components.satellite.parentId,
      });
    if (!position?.parentId) {
      entity.updateComponent("physicsWorld", {enabled: false});
      return;
    }
    const worldPosition = getWorldPosition(position);
    entity.updateComponent("physicsWorld", {
      location: {...worldPosition, parentId: position.parentId},
    });
  }
  postUpdate(): void {
    // After all of the world positions have been updated,
    // we can determine which ones should be enabled and
    // which should be disabled.
    const entities = new Map<string, Entity[]>();
    this.entities.forEach(entity => {
      const {location} = entity.components.physicsWorld || {};
      if (!location) return;
      const key = getSectorNumber(location);
      if (!entities.has(key)) entities.set(key, []);
      entities.get(key)?.push(entity);
    });
    entities.forEach(entities => {
      entities.forEach((entity, index) => {
        entity.updateComponent("physicsWorld", {enabled: index === 0});
      });
    });
  }
}

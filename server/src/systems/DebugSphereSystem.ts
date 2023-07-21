import {pubsub} from "@server/init/pubsub";
import {Entity, System} from "../utils/ecs";

export class DebugSphereSystem extends System {
  test(entity: Entity) {
    return !!(
      entity.components.isShip &&
      entity.components.position &&
      entity.components.shipBehavior
    );
  }
  debugSphereMap = new Map<Entity, Entity>();
  update(entity: Entity, _elapsedMs: number): void {
    const debugSphere = this.debugSphereMap.get(entity);
    if (!debugSphere || !entity.components.position) return;
    debugSphere.updateComponent(
      "position",
      entity.components.shipBehavior?.destination || entity.components.position
    );
  }
  addEntity(entity: Entity): void {
    super.addEntity(entity);
    // Create a debug sphere
    const debugSphere = new Entity();
    debugSphere.addComponent("debugSphere", {entityId: entity.id});
    debugSphere.addComponent(
      "position",
      entity.components.shipBehavior?.destination || entity.components.position
    );
    this.ecs.addEntity(debugSphere);
    this.debugSphereMap.set(entity, debugSphere);
    pubsub.publish.starmapCore.debugSpheres({
      systemId: debugSphere.components.position?.parentId || null,
    });
  }
  removeEntity(entity: Entity): void {
    super.removeEntity(entity);

    // Remove the debug sphere
    const debugSphere = this.entities.find(
      e => e.components.debugSphere?.entityId === entity.id
    );
    if (debugSphere) {
      this.ecs.removeEntity(debugSphere);
      pubsub.publish.starmapCore.debugSpheres({
        systemId: debugSphere.components.position?.parentId || null,
      });
    }
  }
}

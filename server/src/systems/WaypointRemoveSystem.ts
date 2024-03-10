import {pubsub} from "@server/init/pubsub";
import {type Entity, System} from "@server/utils/ecs";

export class WaypointRemoveSystem extends System {
  test(entity: Entity) {
    return !!entity.components.isWaypoint;
  }
  update(entity: Entity) {
    const ship = this.ecs.getEntityById(
      entity.components.isWaypoint?.assignedShipId || -1
    );

    if (!ship) return;

    if (!ship.components.position || !entity.components.position) return;
    if (
      ship.components.position?.parentId ===
      entity.components.position?.parentId
    ) {
      const distance = Math.hypot(
        ship.components.position.x - entity.components.position.x,
        ship.components.position.y - entity.components.position.y,
        ship.components.position.z - entity.components.position.z
      );

      if (distance < 5) {
        // Update the ship autopilot
        ship.updateComponent("autopilot", {
          destinationWaypointId: null,
          desiredCoordinates: undefined,
          desiredSolarSystemId: undefined,
          rotationAutopilot: false,
          forwardAutopilot: false,
        });

        // Delete the waypoint
        this.ecs.removeEntity(entity);

        pubsub.publish.pilot.autopilot.get({shipId: ship.id});
        pubsub.publish.waypoints.all({shipId: ship.id});
      }
    }
  }
}

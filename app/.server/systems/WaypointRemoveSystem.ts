import { pubsub } from "@thorium/.server/init/pubsub";
import { clearAutopilotState } from "@thorium/utils/.server/ship/clearAutopilotState";
import { type Entity, System } from "@thorium/utils/ecs";

export class WaypointRemoveSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isWaypoint;
	}
	update(entity: Entity) {
		const ship = this.ecs.getEntityById(entity.components.isWaypoint?.assignedShipId || -1);

		if (!ship) return;

		// Only remove waypoints that are the ship's active autopilot destination
		if (ship.components.autopilot?.destinationWaypointId !== entity.id) return;

		if (!ship.components.position || !entity.components.position) return;
		if (ship.components.position?.parentId === entity.components.position?.parentId) {
			const distance = Math.hypot(
				ship.components.position.x - entity.components.position.x,
				ship.components.position.y - entity.components.position.y,
				ship.components.position.z - entity.components.position.z,
			);

			// TODO April 5, 2025 - Make it so the desired rotation is set to point the ship towards the object
			// const object = this.ecs.getEntityById(
			// 	entity.components.isWaypoint?.attachedObjectId || -1,
			// );

			if (distance < 5) {
				clearAutopilotState(ship);

				// Deactivate the waypoint
				entity.updateComponent("isWaypoint", { isActive: false });

				pubsub.publish.pilot.autopilot.get({ shipId: ship.id });
				pubsub.publish.waypoints.all({ shipId: ship.id });
			}
		}
	}
}

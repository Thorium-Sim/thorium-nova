import type { Entity } from "@thorium/utils/ecs";
import { pubsub } from "@thorium/.server/init/pubsub";

/**
 * Resets all autopilot navigation state on a ship entity.
 * Used when arriving at a destination, unlocking course,
 * overshooting waypoints, or destroying a ship.
 */
export function clearAutopilotState(entity: Entity) {
	entity.updateComponent("autopilot", {
		destinationWaypointId: null,
		desiredCoordinates: null,
		desiredRotation: null,
		desiredSolarSystemId: null,
		path: [],
		nextCoordinates: null,
		rotationAutopilot: false,
		forwardAutopilot: false,
	});
}

/**
 * Deactivates forward autopilot when the pilot manually uses flight controls.
 * No-op if forward autopilot is already off.
 */
export function deactivateForwardAutopilot(ship: Entity) {
	if (ship.components.autopilot?.forwardAutopilot) {
		ship.updateComponent("autopilot", {
			forwardAutopilot: false,
		});
		pubsub.publish.pilot.autopilot.get({ shipId: ship.id });
	}
}

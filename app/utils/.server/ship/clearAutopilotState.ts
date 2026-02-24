import type { Entity } from "@thorium/utils/ecs";

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
		cachedRoll: null,
		desiredSolarSystemId: null,
		path: [],
		nextCoordinates: null,
		rotationAutopilot: false,
		forwardAutopilot: false,
	});
}

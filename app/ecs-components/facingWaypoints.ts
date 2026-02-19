import z from "zod";

export const facingWaypoints = z
	.object({
		/**
		 * IDs of active waypoints the ship is currently facing (within 3 degrees),
		 * sorted by distance (nearest first). Computed by FacingWaypointSystem.
		 */
		ids: z.array(z.number()).default([]),
	})
	.default({});

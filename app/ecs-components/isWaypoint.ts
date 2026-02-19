import z from "zod";

export const isWaypoint = z
	.object({
		isActive: z.boolean().default(false),
		assignedShipId: z.number().default(-1),
		attachedObjectId: z.number().optional(),
		/** Whether the crew member can delete the waypoint */
		permanent: z.boolean().default(false),
		/** Timestamp for ordering waypoints by most recently interacted */
		lastInteractedAt: z.number().default(0),
	})
	.default({});

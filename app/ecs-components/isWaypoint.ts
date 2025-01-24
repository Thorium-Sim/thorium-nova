import z from "zod";

export const isWaypoint = z
	.object({
		assignedShipId: z.number().default(-1),
		attachedObjectId: z.number().optional(),
	})
	.default({});

import z from "zod";

/**
 * A component that is used to debug the behavior system
 * by showing where the ship is trying to go.
 */
export const debugSphere = z
	.object({
		entityId: z.number().default(-1),
	})
	.default({});

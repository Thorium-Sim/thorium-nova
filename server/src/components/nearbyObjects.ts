import z from "zod";

export const nearbyObjects = z
	.object({
		/**
		 * The key is the entity id, the value is the distance in kilometers.
		 */
		objects: z.any(),
	})
	.default({})
	.nullable();

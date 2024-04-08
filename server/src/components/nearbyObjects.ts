import z from "zod";

export const nearbyObjects = z
	.object({
		/**
		 * A map. The key is the entity id, the value is the distance in kilometers.
		 */
		objects: z.any(),
	})
	.default({})
	.nullable();

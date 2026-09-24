import z from "zod";

/** The various handles this object has across multiple physics worlds */
export const physicsHandles = z
	.object({
		/**
		 * The key is the world's entity id, the value is the handle.
		 */
		handles: z.any(),
	})
	.default({})
	.nullable();

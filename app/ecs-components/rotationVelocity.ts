import z from "zod";

/**
 * Angular velocity in radians / second
 */
export const rotationVelocity = z
	.object({
		x: z.number().default(0),
		y: z.number().default(0),
		z: z.number().default(0),
	})
	.default({});

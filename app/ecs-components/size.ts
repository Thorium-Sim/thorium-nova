import z from "zod";

/**
 * Used for measuring the size of ships and ship-like entities.
 * Measurements in meters
 *
 * Typically these measurements should be calculated from the length
 * of the object and the dimensions of the 3D models that represents the object
 */
export const size = z
	.object({
		length: z.number().default(350),
		width: z.number().default(135),
		height: z.number().default(67),
	})
	.default({});

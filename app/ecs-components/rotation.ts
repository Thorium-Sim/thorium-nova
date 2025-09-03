import z from "zod";

export const rotation = z
	.object({
		x: z.number().default(0),
		y: z.number().default(0),
		z: z.number().default(0),
		w: z.number().default(1),

		// For legacy mode
		yaw: z.number().default(0),
		pitch: z.number().default(0),
		roll: z.number().default(0),
	})
	.default({});

import z from "zod";

export const isDestroyed = z
	.object({
		timeToDestroy: z.number().default(0),
		timer: z.number().default(0),
		explosion: z.enum(["none", "small", "medium", "large"]).default("none"),
	})
	.default({});

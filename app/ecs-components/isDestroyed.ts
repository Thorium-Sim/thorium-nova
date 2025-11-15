import z from "zod";

export const isDestroyed = z
	.object({
		destroyedTimestamp: z.number().default(0),
		timeToDestroy: z.number().nullish().default(0),
		timer: z.number().default(0),
		explosion: z.enum(["none", "small", "medium", "large"]).default("none"),
	})
	.default({});

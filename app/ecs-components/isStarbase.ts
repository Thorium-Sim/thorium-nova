import z from "zod";

export const isStarbase = z
	.object({
		value: z.literal(true).default(true),
	})
	.default({});

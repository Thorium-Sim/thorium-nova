import z from "zod";

export const isTargeting = z
	.object({
		/** The ID of the currently targeted entity */
		target: z.number().nullable().default(null),
	})
	.default({});

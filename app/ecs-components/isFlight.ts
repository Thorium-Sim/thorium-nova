import z from "zod";
export const isFlight = z
	.object({
		respawnTimeMs: z.number().nullable().default(null),
		value: z.boolean().default(true),
	})
	.default({});

import z from "zod";
export const isFlight = z
	.object({
		value: z.boolean().default(true),
	})
	.default({});

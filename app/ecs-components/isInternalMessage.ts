import { z } from "zod";

export const isInternalMessage = z
	.object({
		shipId: z.number().default(-1),
		destination: z.string().default(""),
		sender: z.string().default(""),
		timestamp: z.number().default(() => Date.now()),
		content: z.string().default(""),
	})
	.default({});

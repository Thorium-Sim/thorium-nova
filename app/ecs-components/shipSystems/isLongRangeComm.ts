import { z } from "zod";

export const isLongRangeComm = z
	.object({
		cyphers: z
			.object({
				font: z.string(),
				name: z.string(),
				code: z.string(),
				active: z.boolean(),
			})
			.array()
			.default([]),
	})
	.default({});

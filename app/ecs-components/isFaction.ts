import z from "zod";

export const isFaction = z.object({}).default({});

export const faction = z
	.object({ factionId: z.number().default(-1) })
	.default({});

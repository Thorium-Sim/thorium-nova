import z from "zod";

export const isPlayerShip = z
	.object({
		value: z.literal(true).default(true),
	})
	.default({});

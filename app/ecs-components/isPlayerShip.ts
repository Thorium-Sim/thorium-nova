import z from "zod";

export const isPlayerShip = z
	.object({
		value: z.coerce.boolean().default(true),
	})
	.default({});
export const isTrainingShip = z
	.object({
		value: z.coerce.boolean().default(true),
	})
	.default({});

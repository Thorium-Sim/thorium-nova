import z from "zod";

export const tweaks = z
	.object({
		speedMultiplier: z.number().optional(),
		damageReportEffectMultiplier: z.number().optional(),
	})
	.default({});

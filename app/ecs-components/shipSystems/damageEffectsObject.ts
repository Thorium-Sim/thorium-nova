import { z } from "zod";

export const damageEffectsObject = z
	.object({
		efficiency: z.number(),
		heatMultiplier: z.number(),
		instability: z.number(),
		signature: z.number(),
		failureRisk: z.number(),
		cascadeRisk: z.number(),
		crewSafetyRating: z.number(),
	})
	.partial();

import {
	damageTypes,
	diagnosticRecord,
} from "@thorium/utils/flags/damageTypes";
import z from "zod";

const damageEffectsObject = z
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

export const diagnostic = z
	.object({
		/** The ID of the ship which initiated this diagnostic */
		shipId: z.number().default(-1),
		/** What kind of scan is being performed */
		level: z.enum(["1", "2", "3", "4"]).default("1"),
		/** Diagnostic's progress percentage */
		progress: z.number().default(0),
		/** The ID of the system the diagnostic is performed on */
		targetSystemId: z.number().default(-1),
		/** The damage metrics when the diagnostic completed */
		results: diagnosticRecord.optional(),
		/** The damage report candidates for this diagnostic */
		reportCandidates: z
			.object({
				id: z.string(),
				type: damageTypes,
				affectedSystems: z
					.object({
						id: z.number(),
						name: z.string(),
						metrics: damageEffectsObject,
					})
					.array(),
			})
			.array()
			.optional(),
	})
	.default({});

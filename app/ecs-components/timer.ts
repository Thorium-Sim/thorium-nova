import z from "zod";

// Zod schema that matches the Timer component
export const timer = z
	.object({
		label: z.string().default("Generic"),
		remainingDurationMs: z.number().default(1000 * 60 * 5),
		paused: z.boolean().default(false),
		hidden: z.boolean().default(false),
		// Timeline blocks that are activated when
		// this timer completes
		completeBlocks: z.any().array().default([]),
		blockMetadata: z
			.object({
				stepId: z.number().optional(),
				localVariables: z.record(z.any()).optional(),
				theResult: z.any().optional(),
				executionType: z.enum(["prerequisite", "main"]).optional(),
				callReturnBlocks: z.any().array().default([]).optional(),
			})
			.optional(),
	})
	.default({});

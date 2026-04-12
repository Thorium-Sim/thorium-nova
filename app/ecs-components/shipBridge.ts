import z from "zod";

export const shipBridge = z
	.object({
		clientAssignments: z
			.object({
				clientName: z.string(),
				stationId: z.string(),
				isSoundPlayer: z.boolean().default(false),
			})
			.array()
			.default([]),
	})
	.optional();

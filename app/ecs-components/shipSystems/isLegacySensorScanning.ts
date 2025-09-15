import z from "zod";

export const isLegacySensorScanning = z
	.object({
		// Scan results are handled by the most recent scan entity
		presetAnswers: z
			.object({ label: z.string(), value: z.string() })
			.array()
			.default([]),
		presetInfo: z
			.object({ label: z.string(), value: z.string() })
			.array()
			.default([]),
		isScanning: z.boolean().default(false),
		scanHistory: z.boolean().default(false),
	})
	.default({});

import z from "zod";

export const isLegacySensorScanning = z
	.object({
		// Scan results are handled by the most recent scan entity
		scanAnswers: z.object({ label: z.string(), value: z.string() }).array().default([]),
		presetInfo: z.object({ label: z.string(), value: z.string() }).array().default([]),
		scanHistory: z.boolean().default(false),
	})
	.default({});

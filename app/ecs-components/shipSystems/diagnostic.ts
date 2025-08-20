import { diagnosticRecord } from "@thorium/utils/flags/damageTypes";
import z from "zod";

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
	})
	.default({});

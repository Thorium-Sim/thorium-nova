import { scanRecord } from "@thorium/utils/flags/scanTypes";
import z from "zod";

export const isSensors = z
	.object({
		/** The maximum sensor range in kilometers*/
		passiveRange: z.number().default(1_000_000),
		/** The range for high-fidelity scans */
		activeRange: z.number().default(100_000),
		/** How much energy is required to perform an active scan when the target is right next to the ship, in kilowatt hours. */
		minScanEnergyCost: z.number().default(5),
		/** How much energy is required to perform an active scan when the target is at the active range from the ship, in kilowatt hours. */
		maxScanEnergyCost: z.number().default(15),
		/** How much to multiply the energy cost when the target's shields are raised */
		shieldPenaltyMultiplier: z.number().default(2),
		/** Scan results database */
		resultsDatabase: z
			.union([
				z.array(z.tuple([z.number(), scanRecord])),
				z.map(z.number(), scanRecord),
			])
			.default([])
			.transform((val) => (val instanceof Map ? val : new Map(val))),
		selectedContact: z.number().nullable().default(null),
	})
	.default({});

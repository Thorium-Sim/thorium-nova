import z from "zod";

const scanRecord = z.object({
	iff: z
		.object({
			factionName: z.string(),
		})
		.optional(),
	crew: z
		.object({
			count: z.number(),
		})
		.optional(),
	/** Key is the cargo name, value is the count */
	cargo: z.record(z.number()).optional(),
	shields: z
		.object({
			/** Whether shields are raised or lowered */
			status: z.enum(["up", "down"]).optional(),
			/** Aggregated strength of all the shields */
			strength: z.number().optional(),
		})
		.optional(),
	weapons: z
		.array(
			z.discriminatedUnion("type", [
				z.object({ type: z.literal("phasers"), charge: z.number() }),
				z.object({ type: z.literal("torpedoes"), loaded: z.string() }),
			]),
		)
		.optional(),
	targeting: z
		.object({
			targetName: z.string(),
		})
		.optional(),
	/** Key is the system name, value is the efficiency percent. */
	damage: z.record(z.number()).optional(),
});

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
		/** Scan results database */
		resultsDatabase: z
			.union([
				z.array(z.tuple([z.number(), scanRecord])),
				z.map(z.number(), scanRecord),
			])
			.default([])
			.transform((val) => (val instanceof Map ? val : new Map(val))),
	})
	.default({});

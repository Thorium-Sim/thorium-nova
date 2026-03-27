import z from "zod";

export const isFaction = z
	.object({
		/** How likely a ship of this faction will engage with a new target, 0 is passive, 1 is aggressive */
		aggressiveness: z.number().default(0.5),
		/** What short range comm frequency ranges the faction likes to call on */
		shortRangeFrequencyRange: z
			.tuple([z.number(), z.number()])
			.default([265.5, 286.25]),
	})
	.default({});

export const faction = z
	.object({ factionId: z.number().default(-1) })
	.default({});

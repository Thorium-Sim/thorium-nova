import z from "zod";

export const isMainComputer = z
	.object({
		/** How much energy is required to perform an active scan when the target is right next to the ship, in kilowatt hours. */
		minDiagnosticEnergyCost: z.number().default(5),
		/** How much energy is required to perform an active scan when the target is at the active range from the ship, in kilowatt hours. */
		maxDiagnosticEnergyCost: z.number().default(15),
	})
	.default({});

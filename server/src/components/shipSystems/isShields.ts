import z from "zod";

export const isShields = z
	.object({
		/** The frequency of the shields in megahertz */
		frequency: z.number().default(398.4),
		/** The current blocking energy of the shields in GigaJoules */
		strength: z.number().default(0),
		/** The maximum blocking energy of the shields in GigaJoules */
		maxStrength: z.number().default(5),
		/**
		 * Efficiency drop for every hit is calculated based on the max strength, current strength.
		 * E = (1 - (Current / Max)) * Multiplier
		 * So max = 5, current = 3, Multiplier = 0.5  == 0.2
		 * If shields are fully raised, efficiency drop is 0
		 **/
		deflectionEfficiencyMultiplier: z.number().default(0.5),
	})
	.default({});

/**
 * Shaders
 * https://www.shadertoy.com/view/llcyDH
 * https://www.shadertoy.com/view/MllyDN
 * https://www.shadertoy.com/view/XtfXzj
 * https://www.shadertoy.com/view/MdlXz8
 * https://www.shadertoy.com/view/llcXW7
 */

import z from "zod";

export const efficiency = z
	.object({
		efficiency: z.number().min(0).max(1).default(1),
		/**
		 * A multiplier to determine how much the efficiency will drop
		 * as power in the system overloads. If currentPower x2 the
		 * maxSafePower (100%) and the multiplier is set to 1, then
		 * efficiency will drop by 100% over the course of 1 second.
		 *
		 * By default, this is set to 0.1, which allows systems to
		 * overload by x2 for 10 seconds.
		 */
		multiplier: z.number().min(0).default(0.015),
		/**
		 * Systems should slowly, randomly lose efficiency to entropy.
		 * This multiplier defines how much will decrease every frame.
		 */
		entropyMultiplier: z.number().min(0).default(0.00005),
	})
	.default({});

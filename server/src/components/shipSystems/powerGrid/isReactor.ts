import z from "zod";

export const isReactor = z
	.object({
		/**
		 * This will be set when the ship is spawned
		 * based on the total power required
		 * to run all systems divided by the number of
		 * reactors in the ship
		 */
		maxOutput: z.number().default(12),
		/**
		 * What percent of the max output provides a 100% fuel-to-energy conversion.
		 * Any higher output than this decreases overall efficiency,
		 * any lower increases overall efficiency, making fuel last longer.
		 */
		optimalOutputPercent: z.number().default(0.7),
		/**
		 * What the reactor is currently outputting, updated by the power ECS System.
		 * It will always be less than or equal to the desired output, never more.
		 */
		currentOutput: z.number().default(8),
		/**
		 * Which system the units of power are allocated.
		 * Each item represents 1 MW of power. The length of this is the desired output.
		 */
		outputAssignment: z.array(z.number()).default([]),
		/**
		 * How much fuel is left to burn after the previous tick. Fuel is only removed
		 * from inventory in whole units. Any fuel not turned into power remains in the
		 * reactor.
		 */
		unusedFuel: z
			.object({
				amount: z.number().default(0),
				density: z.number().default(1),
			})
			.default({}),
	})
	.default({});

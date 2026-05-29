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
		 * What the current desired output of the reactor is. Set by the crew.
		 */
		desiredOutput: z.number().default(12),
		/**
		 * Determines how fast the reactor powers up when changing the output in megawatts per second
		 */
		powerUpSpeed: z.number().default(0.5),
		/**
		 * When reactor power is balanced between all reactors, fuel use and heat increase is multiplied by this
		 */
		balancedBonusMultiplier: z.number().default(0.9),
		/**
		 * Whether all reactors power output is balanced, calculated by the power ECS.
		 */
		balanced: z.boolean().default(true),
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

		/**
		 * Whether the power is provided by an external connection because the ship is docked
		 */
		externalPower: z.boolean().default(false),

		/**
		 * For legacy mode: Settings for adjusting the reactor efficiency/output
		 */
		legacySettings: z
			.object({
				name: z.string(),
				efficiency: z.number().nullable(),
				color: z.enum([
					"primary",
					"secondary",
					"success",
					"warning",
					"error",
					"accent",
					"info",
					"notice",
				]),
			})
			.array()
			.default([]),
	})
	.default({});

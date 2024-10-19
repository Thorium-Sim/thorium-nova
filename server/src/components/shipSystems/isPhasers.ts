import z from "zod";

export const isPhasers = z
	.object({
		/** Range in kilometers */
		maxRange: z.number().default(10000),
		/**
		 * Actual range is determined by difference between
		 * the phaser arc and the max arc.
		 * eg. range = maxRange - (maxRange * (arc / (maxArc+1)))
		 * Add 1 to maxArc to make it so there is still some range when arc == maxArc
		 */
		maxArc: z.number().default(90),
		/** The current arc of the phasers */
		arc: z.number().default(45),

		/** Which direction the phaser fires from, relative to the front of the ship/
		 * 0 is straight ahead, 90 is to the right, 180 is behind, 270 is to the left
		 */
		headingDegree: z.number().default(0),
		/** Angle up or down. Valid values are -90 - 90 */
		pitchDegree: z.number().default(0),

		/**
		 * Multiplies the power output from the phasers
		 * using space magic to make the phasers stronger or weaker
		 */
		yieldMultiplier: z.number().default(1),
		/**
		 * What percent the phasers are currently firing at
		 */
		firePercent: z.number().default(0),
	})
	.default({});

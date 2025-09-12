import { z } from "zod";

export const isPhaserBank = z
	.object({
		/** The ship this phaser bank is attached to */
		shipId: z.number().default(-1),
		/** The phaser system this phaser bank is attached to */
		phaserId: z.number().default(-1),
		/** What this phaser bank is currently doing */
		state: z.enum(["idle", "charging", "firing"]).default("idle"),
		/** The current charge level of this phaser bank */
		charge: z.number().default(0),
		/**
		 * How fast the phaser bank charges
		 */
		chargeSpeed: z.number().default(1),
	})
	.default({});

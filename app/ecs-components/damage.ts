import z from "zod";

export const damage = z
	.object({
		/**
		 * Affects how the system is damaged. Vulnerable systems are biased towards getting damaged more.
		 * Invulnerable systems cannot be damaged.
		 **/
		vulnerability: z
			.enum(["normal", "vulnerable", "invulnerable"])
			.default("normal"),
		/** Whether the system is not operable. */
		offline: z.boolean().default(false),
		/** How low the efficiency must get before the system goes offline */
		offlineEfficiency: z.number().default(0.5),
		/** How high the efficiency must get before the system goes online */
		onlineEfficiency: z.number().default(0.8),

		/** A proxy for overall damage. Power applied to ship systems is multiplied by this value */
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
		overloadDamageMultiplier: z.number().min(0).default(0.015),

		/**
		 * A multiplier for how quickly heat is generated.
		 */
		heatMultiplier: z.number().min(0).default(1),

		/**
		 * The chance that a command send from a station will fail to execute.
		 */
		instability: z.number().min(0).max(1).default(0),

		/**
		 * Makes the sensors signature "louder" so the ship can be seen easier by other ships.
		 */
		signature: z.number().default(0),
		/**
		 * The minimum signature this system can have, regardless of how well repaired it is.
		 */
		minSignature: z.number().default(0),
		/**
		 * The maximum signature this system can have.
		 */
		maxSignature: z.number().default(1),
		/**
		 * How much is added to the signature when the system is in use
		 */
		signatureSpike: z.number().default(2),
		/**
		 * How long the signature spike lasts in seconds.
		 */
		signatureSpikeDuration: z.number().default(5),

		/**
		 * The probability the system will spontaneously go offline
		 */
		failureRisk: z.number().min(0).default(0),

		/**
		 * The chance this system will apply damage to other systems when
		 * when it goes offline
		 */
		cascadeRisk: z.number().min(0).default(0),

		/**
		 * How much this system will injure crew members that are near it.
		 */
		crewSafetyRating: z.number().min(0).default(0),

		/**
		 * Systems should slowly, randomly take damage to entropy.
		 * This multiplier defines how much will decrease every frame.
		 */
		entropyMultiplier: z.number().min(0).default(0.0005),

		/**
		 * Multipliers for different damage types for applying weakness or resistance
		 */
		damageTypeMultipliers: z.record(z.number()).default({}),
	})
	.default({});

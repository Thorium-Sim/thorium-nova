import z from "zod";

export const isBattery = z
	.object({
		/**
		 * The amount of power this battery can hold in MegaWatt Hours. Based
		 * on the other defaults, this value provides
		 * 23 minutes of sustained power.
		 */
		capacity: z.number().default(2),
		/**
		 * How much power the battery is currently storing
		 */
		storage: z.number().default(2),
		/**
		 * How much energy the battery can use to charge. Measured in Megawatts. Typically
		 * batteries charge faster, while capacitors discharge much faster.
		 * Both should discharge slower than they charge.
		 */
		chargeRate: z.number().default(4),
		/**
		 * How much energy is being added to the battery, calculated every frame.
		 * Used for displaying on the power grid card.
		 */
		chargeAmount: z.number().default(0),
		/**
		 * How much energy the battery can provide to connected systems.
		 */
		outputRate: z.number().default(6),
		/**
		 * How much energy is being drained from the battery, calculated every frame.
		 * Used for displaying on the power grid card. This will always be less than
		 * or equal to the length of outputAssignment.
		 */
		outputAmount: z.number().default(0),
		/**
		 * Capacitors only discharge when toggled on. This is where that
		 * toggling happens. Normal batteries won't ever adjust this.
		 */
		discharging: z.boolean().default(true),
		/**
		 * Which reactor each unit of power is coming from. One unit = 1MW
		 */
		powerSources: z.number().array().default([]),
	})
	.default({});

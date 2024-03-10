import z from "zod";

export const isBattery = z
	.object({
		/**
		 * The power nodes that are associated with this battery
		 */
		connectedNodes: z.array(z.number()).default([]),
		/**
		 * The amount of power this battery can hold. This provides
		 * 23 minutes of sustained power.
		 */
		capacity: z.number().default(46),
		/**
		 * How much power the battery is currently storing
		 */
		storage: z.number().default(46),
		/**
		 * How much energy the battery can use to charge. Typically
		 * batteries charge faster than they discharge, while capacitors
		 * discharge much faster than they charge.
		 */
		chargeRate: z.number().default(180),
		/**
		 * How much energy is being added to the battery, calculated every frame.
		 * Used for displaying on the power grid card.
		 */
		chargeAmount: z.number().default(0),
		/**
		 * How much energy the battery provides to connected systems.
		 */
		dischargeRate: z.number().default(120),
		/**
		 * How much energy is being drained from the battery, calculated every frame.
		 * Used for displaying on the power grid card.
		 */
		dischargeAmount: z.number().default(0),
		/**
		 * Capacitors only discharge when toggled on. This is where that
		 * toggling happens. Normal batteries won't ever adjust this.
		 */
		discharging: z.boolean().default(true),
	})
	.default({});

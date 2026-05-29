import z from "zod";

export const power = z
	.object({
		/**
		 * The power levels for a system. If no entries are provided, the system will operate
		 * without any power. The lowest entry is the minimum amount of power required to
		 * make this system operate in megawatts. The highest is the maximum threshold of power
		 * usage for safely using this system in megawatts
		 **/
		powerLevels: z.number().array().default([5, 20]),
		/** The current power in megawatts provided to this system, calculated every frame. */
		currentPower: z.number().default(10),
		/**
		 * How much power the system is attempting to draw, calculated every frame.
		 * This will always be less than or equal to requested power. If the system
		 * isn't doing as much work, it won't draw as much power.
		 */
		powerDraw: z.number().default(0),
		/**
		 * Which battery the system is drawing extra power from
		 */
		batterySource: z.number().nullable().default(null),
		/**
		 * Whether the system is drawing power from the reactors
		 */
		powerActivated: z.boolean().default(true),
	})
	.default({});

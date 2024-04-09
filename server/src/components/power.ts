import z from "zod";

export const power = z
	.object({
		/** The minimum amount of power required to make this system operate */
		requiredPower: z.number().default(5),
		/** The normal amount of power this system will request  */
		defaultPower: z.number().default(10),
		/** The threshold of power usage for safely using this system */
		maxSafePower: z.number().default(20),
		/** The current power provided to this system, calculated every frame. */
		currentPower: z.number().default(10),
		/**
		 * How much power the system is attempting to draw, calculated every frame.
		 * This will always be less than or equal to requested power. If the system
		 * isn't doing as much work, it won't draw as much power.
		 */
		powerDraw: z.number().default(0),
		/** How much power is currently being requested. Could be more than the maxSafePower */
		requestedPower: z.number().default(10),
	})
	.default({});

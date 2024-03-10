import z from "zod";

export const isWarpEngines = z
	.object({
		/** The cruising speed in interstellar space in km/s */
		interstellarCruisingSpeed: z.number().default(599600000000),
		/** The cruising speed in solar system space in km/s */
		solarCruisingSpeed: z.number().default(29980000),
		/** The min speed (warp 1) compared to the cruising speed. Defaults to 0.01 */
		minSpeedMultiplier: z.number().default(0.01),
		/** How many warp factors there are between min and max inclusive. This does not include emergency or destructive warp which are automatically extrapolated. */
		warpFactorCount: z.number().default(5),
		/** The current warp factor. 0 is full stop. */
		currentWarpFactor: z.number().default(0),
		/** The current warp speed in km/s */
		maxVelocity: z.number().default(0),
		/** The forward acceleration of the ship in km/s. */
		forwardAcceleration: z.number().default(0),
		/** The forward velocity of the ship caused by warp in km/s. */
		forwardVelocity: z.number().default(0),
	})
	.default({});

import { engineSpeeds } from "@thorium/ecs-components/shipSystems/engineSpeeds";
import z from "zod";

export const isWarpEngines = z
	.object({
		/** The cruising speed in interstellar space in km/s */
		interstellarCruisingSpeed: z.number().default(599600000000),
		/** The cruising speed in solar system space in km/s */
		solarCruisingSpeed: z.number().default(29980000),
		/** The min speed (warp 1) compared to the cruising speed. Defaults to 0.01 */
		minSpeedMultiplier: z.number().default(0.01),
		/** The current warp factor. 0 is full stop. */
		currentWarpFactor: z.number().default(0),
		/** The current warp speed in km/s */
		maxVelocity: z.number().default(0),
		/** The forward acceleration of the ship in km/s. */
		forwardAcceleration: z.number().default(0),
		/** The forward velocity of the ship caused by warp in km/s. */
		forwardVelocity: z.number().default(0),
		/** Names for how the warp speed is divided. Highest speed is emergency speed. */
		speeds: engineSpeeds.default([
			{ label: "Warp 1", number: "1" },
			{ label: "Warp 2", number: "2" },
			{ label: "Warp 3", number: "3" },
			{ label: "Warp 4", number: "4" },
			{ label: "Warp 5", number: "5" },
			{ label: "Destructive", number: "!!" },
		]),
	})
	.default({});

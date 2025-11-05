import { engineSpeeds } from "@thorium/ecs-components/shipSystems/engineSpeeds";
import z from "zod";

export const isImpulseEngines = z
	.object({
		/** The max speed at full impulse in km/s. */
		cruisingSpeed: z.number().default(1500),
		/** The max speed at emergency impulse in km/s. */
		emergencySpeed: z.number().default(2000),
		/** The force in kilo-newtons which impulse engines apply. */
		thrust: z.number().default(12500),
		/** The desired speed of the ship in km/s. */
		targetSpeed: z.number().default(0),
		/** The forward acceleration of the ship in km/s^2. */
		forwardAcceleration: z.number().default(0),
		/** The measured forward thrust of the ship. */
		forwardImpulse: z.number().default(0),
		/** Names for how the impulse speed is divided. Highest speed is emergency speed. */
		speeds: engineSpeeds.default([
			{ label: "1/4 Impulse", number: "0.25" },
			{ label: "1/2 Impulse", number: "0.5" },
			{ label: "3/4 Impulse", number: "0.75" },
			{ label: "Full Impulse", number: "1.0" },
			{ label: "Destructive", number: "1.25" },
		]),
	})
	.default({});

import z from "zod";

export const isTorpedoLauncher = z
	.object({
		status: z
			.enum(["ready", "loading", "unloading", "loaded", "firing"])
			.default("ready"),
		/**
		 * Progression from one status to another.
		 * Set to a time in ms when the process starts and is decremented each game frame
		 **/
		progress: z.number().default(0),

		/** The time in ms to load and unload */
		loadTime: z.number().default(5000),

		/** The time in ms to fire */
		fireTime: z.number().default(1000),

		/** The entity currently being loaded into the torpedo tube */
		torpedoEntity: z.number().nullable().default(null),

		/** Which direction the torpedo launcher launches from, relative to the front of the ship/
		 * 0 is straight ahead, 90 is to the right, 180 is behind, 270 is to the left
		 */
		headingDegree: z.number().default(0),
		/** Angle up or down. Valid values are -90 - 90 */
		pitchDegree: z.number().default(0),
	})
	.default({});

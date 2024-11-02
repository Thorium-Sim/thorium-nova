import { sound } from "@server/components/sound";
import z from "zod";

/** Use the position component to determine the sound's position in space. */
export const soundEffect = z
	.object({
		/** The sounds that will play simultaneously */
		sounds: sound.array().default([]),
		/** How many milliseconds since the sound was created. For determining when to remove a sound. */
		playbackTime: z.number().default(0),
		/** The max amount of time for the sounds to play. Null for looping sounds. */
		maxPlaybackTime: z.number().nullish(),
		/** The range of the sound in space in kilometers, for determining if the sound is in range. */
		range: z.number().optional(),
		/** The simulator where the sound will play */
		simulatorId: z.number().optional(),
		/** Which stations the sound plays on */
		stations: z.number().array().optional(),
		/** Which clients the sound plays on */
		clients: z.string().array().optional(),
	})
	.default({});

import { sound } from "@server/components/sound";
import z from "zod";

export const soundEffect = z
	.object({
		/** The sounds that will play simultaneously */
		sounds: sound.array().default([]),
		/** The position of the sound in space, for determining if the sound is in range. */
		position: z.object({}).optional(),
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

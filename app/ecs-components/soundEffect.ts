import { position } from "@thorium/ecs-components/position";
import { sound } from "@thorium/ecs-components/sound";
import z from "zod";

export type SoundEffect = z.infer<typeof soundEffects>["looping"][number];

/**
 * Types of sound effects:
 * - Phaser fire
 * - Red alert
 * - Heat alert
 * - Ambiance
 *
 * The only sound effects that are stored are looping sounds
 * They continue to loop until the sound is removed from the
 * universe
 *
 * All sounds are just published to the clients as they are played.
 * Looped sounds are also published, and marked as looped as long
 * as they are included in the looped sounds subscription.
 *
 * That should remove the need for a sounds system that manages all
 * sounds, which also removes the need for the server to know the sound
 * duration. Rather, systems play and manage their own sounds.
 */

/** Use the position component to determine the sound's position in space. */
export const soundEffects = z.object({
	/** The sounds at the disposal of this entity */
	soundBank: z.record(sound.array()).default({}),
	/** The currently looping sounds which eventually need to be cancelled */
	looping: z
		.object({
			id: z.string(),
			// Sounds of the same key will replace each other
			key: z.string(),
			/** The sounds that will play simultaneously when this sound is created. */
			sounds: sound.array().default([]),
			range: z
				.object({
					/** The range of the sound in space in kilometers, for determining if the sound is in range. */
					distance: z.number(),
					/** The position of the sound in space */
					position,
				})
				.optional(),

			/** Which stations the sound plays on. If stationId is not provided, it plays on all stations on the ship. */
			stations: z
				.object({ stationId: z.string().optional(), shipId: z.number() })
				.array()
				.optional(),
			/** Which clients the sound plays on */
			clients: z.string().array().optional(),
		})
		.array()
		.default([]),
});

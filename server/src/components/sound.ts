import z from "zod";

const range = z.tuple([z.number(), z.number()]);

export const sound = z.object({
	url: z.string(),
	/**
	 * The range of volume levels for the sound, chosen at random from the range when the sound plays.
	 */
	volume: range.default([1, 1]),
	/**
	 * The range of playback rates for the sound, chosen at random from the range when the sound plays.
	 */
	playbackRate: range.default([1, 1]),
	/**
	 * Whether the sound loops or not.
	 */
	loop: z.boolean().default(false),
	/** At what point in the sound in seconds the loop returns to */
	loopStart: z.number().nullable().default(null),
	/** At what point in the sound in seconds the loop ends, allowing for the sound to finish playing when the loop is done */
	loopEnd: z.number().nullable().default(null),
	/**
	 * The delay in seconds before the sound starts playing.
	 */
	delay: z.number().default(0),
	/** The time in seconds between loops or sounds of the same type. */
	gap: z.number().default(0),
	/**
	 * Which channels the sound plays on. If null, it uses the same channels as the sound effect. If set, the sound is downmixed to the number of channels.
	 */
	channel: z.number().array().nullable().default(null),
});

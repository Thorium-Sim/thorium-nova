import { z } from "zod";

export const isLongRangeComm = z
	.object({
		cyphers: z
			.object({
				font: z.string(),
				name: z.string(),
				code: z.string(),
				active: z.boolean(),
			})
			.array()
			.default([]),
		addressBook: z
			.object({
				destinationId: z.number().int(),
				/** Typically it uses the destination's name, but for narrative purposes we can override it */
				name: z.string().optional(),
				/**
				 * When long range messages are sent to this destination, we match the message contents against
				 * this list of actions to determine which action to perform.
				 *
				 * This depends on some kind of classification engine, which doesn't exist yet. For now,
				 * either messages sent by the crew are addressed by a Flight Director or ignored.
				 */
				actions: z
					.object({
						intent: z.string(),
						params: z.string().array(),
						blocks: z.any().array(),
					})
					.array(),
			})
			.array()
			.default([]),
	})
	.default({});

export const isLongRangeMessage = z
	.object({
		timestamp: z.number().default(0),
		message: z.string().default(""),
		destinationShipId: z.number().int().default(-1),
		senderShipId: z.number().int().default(-1),
		state: z.enum(["draft", "review", "sent", "deleted"]).default("draft"),

		// Decoding parameters
		encoding: z
			.union([
				z.object({
					type: z.literal("waves"),
					waves: z
						.object({
							amplitude: z.number().default(10),
							frequency: z.number().default(10),
							phase: z.number().default(10),
							requiredAmplitude: z.number().default(10),
							requiredFrequency: z.number().default(10),
							requiredPhase: z.number().default(10),
						})
						.array(),
				}),
				z.object({
					type: z.literal("replacement"),
					letterMap: z.record(z.string()),
					requiredLetterMap: z.record(z.string()),
				}),
				z.object({
					type: z.literal("decoded"),
				}),
			])
			.default({ type: "decoded" }),
	})
	.default({});

export const isCommSatellite = z.object({
	/** The comm satellite's radius in Light Years. It can send and receive messages from ships and other comm satellites within this radius */
	radius: z.number().default(10),
});

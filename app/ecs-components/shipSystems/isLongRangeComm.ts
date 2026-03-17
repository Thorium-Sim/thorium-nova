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
				contactId: z.number().int(),
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
		antennaFrequency: z.number().default(276.25),
		antennaGain: z.number().default(0.1),
		/** The satellite detection radius in light years at required power */
		minSatelliteRange: z.number().default(1),
		/** The satellite detection radius in light years at max safe power */
		maxSatelliteRange: z.number().default(10),
		/** The number of comm satellites to display in legacy mode */
		legacyCommSatellites: z.number().default(3),
	})
	.default({});

export const isLongRangeMessage = z
	.object({
		timestamp: z.number().default(0),
		message: z.string().default(""),
		destinationId: z.number().int().default(-1),
		senderId: z.number().int().default(-1),
		interceptorId: z.number().nullable().default(null),
		senderStation: z.string().default(""),
		state: z
			.enum([
				"pending",
				"sending",
				"failing",
				"intercepted",
				"delivered",
				"read",
				"deleted",
				"undelivered",
			])
			.default("pending"),
		failureReason: z.string().nullable().default(null),
		// Decoding parameters
		encoding: z
			.union([
				z.object({
					type: z.literal("waves"),
					waves: z
						.object({
							amplitude: z.number().default(10),
							frequency: z.number().default(5),
							phase: z.number().default(10),
							requiredAmplitude: z.number().default(10),
							requiredFrequency: z.number().default(10),
							requiredPhase: z.number().default(10),
						})
						.array(),
				}),
				z.object({
					type: z.literal("replacement"),
					/** A string of the 26 letters and 10 numbers in the cypher order */
					letterMap: z.string(),
					requiredLetterMap: z.string(),
				}),
				z.object({
					type: z.literal("rotation"),
					requiredRotation: z.number(),
					rotation: z.number(),
				}),
				z.object({
					type: z.literal("decoded"),
				}),
			])
			.default({ type: "decoded" }),

		/** Used for simulating the transmission of the message through the comm satellite network */
		nextNodeId: z.number().default(-1),
		/** Track the nodes that have been visited so we don't get into a loop */
		visitedNodeIds: z.number().array().default([]),
		/** Speed of movement in lightyears per second */
		transmissionSpeed: z.number().default(0.1),
	})
	.default({});

export const isCommSatellite = z.object({
	/** The comm satellite's radius in Light Years. It can send and receive messages from ships and other comm satellites within this radius */
	radius: z.number().default(10),
	/** What frequency to adjust the long range comm array to in order to connect to this satellite */
	frequency: z.number().default(276.25),
});

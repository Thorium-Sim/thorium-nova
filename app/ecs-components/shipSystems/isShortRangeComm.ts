import z from "zod";

export const isShortRangeComm = z
	.object({
		antennaFrequency: z.number().default(276.25),
		/** The gain that the player wants to have */
		antennaGain: z.number().default(0.1),
		/** The actual gain based on the current power */
		actualGain: z.number().default(0.1),
		/** The minimum comm radius in Kilometers at minimum power */
		minRadius: z.number().default(10_000),
		/** The minimum comm radius in Kilometers at maximum power */
		maxRadius: z.number().default(1_000_000),
		state: z.enum(["idle", "hailing", "connected"]).default("idle"),
		/**
		 * Reference to the isShortRangeCommConversation entity for an active conversation..
		 */
		conversationId: z.number().nullable().default(null),
		/**
		 * Reference to a isConversationTemplate entity.
		 * When hailing an NPC ship, this is the conversation which will ensue.
		 * If not set, the hail will be rejected.
		 **/
		templateConversationId: z.number().nullable().default(null),
	})
	.default({});

/**
 * Created when a conversation is started between two ships
 * or assigned to an NPC ship to say what conversation it would have
 * if a player ship were to call it.
 **/
export const isShortRangeCommConversation = z
	.object({
		frequency: z.number().default(276.25),
		hostId: z.number().default(-1),
		targetId: z.number().default(-1),
		/** Allow other participants to join in this conversation */
		allowAdditionalParticipants: z.boolean().default(false),
	})
	.default({});

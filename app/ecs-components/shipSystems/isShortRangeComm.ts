import z from "zod";

export const isShortRangeComm = z
	.object({
		antennaFrequency: z.number().default(276.25),
		antennaGain: z.number().default(0.1),
		/** The minimum comm radius in Kilometers at minimum power */
		minRadius: z.number().default(10_000),
		/** The minimum comm radius in Kilometers at maximum power */
		maxRadius: z.number().default(1_000_000),
		state: z.enum(["idle", "scanning", "calling", "connected"]).default("idle"),
		/**
		 * Reference to the isShortRangeCommConversation entity.
		 * For a player ship, this is the current conversation that they are connected to.
		 * For a NPC, this is either the current conversation or a conversation they are
		 * going to have when they are called or their hail is connected.
		 */
		conversationId: z.number().default(-1),
		/**
		 * How the ship attached to this system is referenced in the Ink conversation,
		 * for conversations between more than two player or NPC ships
		 **/
		conversationTag: z.string().default("Crew"),
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
		conversationTemplateId: z.number().nullable().default(null),
		/**
		 * The Ink story class that runs the conversation. Not persisted,
		 * it should be re-created using the conversation template and the conversationState
		 */
		inkStory: z.any().default(null),
		/** The current line of dialogue being delivered */
		currentDialogue: z
			.object({
				text: z.string(),
				/** For more than one speakers in the conversation, this is the ID of the conversation partner delivering the dialogue */
				speakerId: z.number(),
			})
			.default({ text: "", speakerId: -1 }),
		/** The choices that are available for the player ships to choose from */
		currentChoices: z
			.object({
				text: z.string(),
				/** For more than one player ship in the conversation, this is the ID of the conversation partner that is able to deliver this line of dialogue.
				 * If null, any player ship may deliver the line.
				 */
				speakerId: z.number().nullable(),
				/** If this choice was selected, we keep the remaining choices on the screen while the next line of dialogue is delivered */
				selected: z.boolean().default(false),
			})
			.array()
			.default([]),
		/** The saved conversation state from Ink */
		conversationState: z.any(),
	})
	.default({});

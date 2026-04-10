import z from "zod";

/**
 * Spawned when a mission is started to have
 * access to the assets without needing to reference
 * a plugin.
 */
export const isConversationTemplate = z
	.object({
		inkFilePath: z.string().default(""),
	})
	.default({});

/**
 * Defines the Ink story and properties used for all kinds of conversations
 **/
export const isConversation = z
	.object({
		inkFilePath: z.string().default(""),
		/**
		 * The Ink story class that runs the conversation. Not persisted,
		 * it should be re-created using the conversation template and the conversationState
		 */
		inkStory: z.any().default(null),
		/** The saved conversation state from Ink */
		conversationState: z.string().default(""),
		/** The lines of dialogue that have been delivered, from first to last */
		currentDialogue: z
			.object({
				text: z.string(),
				/** For more than one speakers in the conversation, this is the ID of the conversation partner delivering the dialogue */
				speakerId: z.number(),
			})
			.array()
			.default([]),
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
	})
	.default({});

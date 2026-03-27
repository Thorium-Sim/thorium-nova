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

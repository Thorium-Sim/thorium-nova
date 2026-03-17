import z from "zod";

export const shipBridge = z
	.object({
		pluginId: z.string(),
		bridgeId: z.string(),
	})
	.optional();

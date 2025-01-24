import z from "zod";

// Zod schema that matches the Timer component
export const timer = z
	.object({
		label: z.string().default("Generic"),
		time: z.string().default("00:05:00"),
		paused: z.boolean().default(false),
	})
	.default({});

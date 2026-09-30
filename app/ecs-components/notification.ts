import { timelineBlock } from "@thorium/ecs-components/timelineBlocks";
import z from "zod";

export const notification = z
	.object({
		// The ship and station which the notification should appear on. Might appear on multiple clients.
		shipId: z.number().default(-1),
		station: z.string().default(""),
		// Body and description are taken care of by the identity component
		// Duration and paused are taken care of by the timer component
		color: z.enum(["info", "success", "warning", "error", "notice"]).default("info"),
		actions: z
			.object({
				label: z.string().optional(),
				blocks: timelineBlock.array(),
				localVariables: z.any(),
			})
			.array()
			.optional(),
	})
	.default({});

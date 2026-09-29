import { timelineBlock } from "@thorium/ecs-components/timelineBlocks";
import z from "zod";

export const notification = z
	.object({
		clientId: z.string().default(""),
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

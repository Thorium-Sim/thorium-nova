import { timelineBlock } from "@thorium/ecs-components/timelineBlocks";
import z from "zod";

/** Assigned to the flight client entity */
export const keyboard = z
	.object({
		keys: z.record(
			z.string(),
			z.object({
				downBlocks: timelineBlock.array(),
				upBlocks: timelineBlock.array(),
				localVariables: z.record(z.string(), z.any()).nullable().optional(),
			}),
		),
	})
	.default({
		keys: {},
	});

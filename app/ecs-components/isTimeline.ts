import z from "zod";

export const isTimeline = z
	.object({
		type: z
			.enum(["mission", "macro", "trigger", "training", "report"])
			.default("macro"),
		/**
		 * References to the isTimelineStep entities associated
		 * with this timeline.
		 */
		steps: z.number().array().default([]),
		/**
		 * The current step of the timeline. Used for automatically advancing.
		 */
		currentStep: z.number().default(0),
	})
	.default({});

// TODO June 17, 2025 - Make a proper schema for blocks
export const isTimelineStep = z
	.object({
		active: z.boolean().default(true),
		/**
		 * What blocks will be executed when this timeline step activates
		 */
		blocks: z.any().array().default([]),
		timelineId: z.number().optional(),
	})
	.default({});

import z from "zod";

export const isTimeline = z
	.object({
		shipId: z.number().optional(),
		type: z.enum(["mission", "training", "report"]).default("mission"),
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
		/** Whether the timeline step has been executed */
		state: z.enum(["pending", "executing", "executed"]).default("pending"),
		/**
		 * What blocks will be executed when this timeline step activates
		 */
		blocks: z.any().array().default([]),
		timelineId: z.number().optional(),
	})
	.default({});

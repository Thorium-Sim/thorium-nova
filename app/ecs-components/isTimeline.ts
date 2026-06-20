import z from "zod";

export const isTimeline = z
	.object({
		shipId: z.number().optional(),
		/** The name of the plugin this timeline spawned from, useful for the Timeline Editor core */
		pluginName: z.string().optional(),

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
		/**
		 * Whether the timeline has advanced past its final step.
		 */
		isComplete: z.boolean().default(false),
	})
	.default({});

// TODO June 17, 2025 - Make a proper schema for blocks
export const isTimelineStep = z
	.object({
		/** Reference to the ID of the permanent timeline step, useful for the Timeline Editor core */
		timelineStepId: z.string().optional(),
		/** Whether the timeline step has been executed */
		state: z.enum(["pending", "executing", "executed"]).default("pending"),
		/**
		 * What blocks will be executed when this timeline step activates
		 */
		blocks: z.any().array().default([]),
		timelineId: z.number().optional(),
	})
	.default({});

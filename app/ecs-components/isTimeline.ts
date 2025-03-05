import { actionSchema } from "@thorium/utils/flags/actionSchema";
import z from "zod";

export const isTimeline = z
	.object({
		isMission: z.boolean().default(false),
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

export const isTimelineStep = z
	.object({
		active: z.boolean().default(true),
		/**
		 * What actions are assigned to this timeline step
		 */
		actions: actionSchema.default([]),
		timelineId: z.number().optional(),
	})
	.default({});

import z from "zod";
import {actionSchema} from "../utils/actionSchema";

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
    actions: actionSchema.default([]),
    timelineId: z.number().optional(),
  })
  .default({});

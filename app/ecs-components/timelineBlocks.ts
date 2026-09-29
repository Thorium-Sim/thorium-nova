import type { TimelineBlock } from "@thorium/components/timelineBuilder/TimelineBlockTypes";
import z from "zod";

// We cheat so we get type safety in development without the rigid structure of the Zod type
export const timelineBlock: z.ZodType<TimelineBlock> = z.any();

import { z } from "zod";

/** This is a legacy system */
export const isCoolantTank = z
	.object({
		/** Which system coolant is being transferred to */
		transferSystem: z.number().nullable().default(null),
		/** Whether coolant is being transferred into the coolant tank or out of the coolant tank */
		transferDirection: z.enum(["in", "out"]).default("out"),
	})
	.default({});

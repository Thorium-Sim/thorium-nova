import z from "zod";

export const isObjective = z
	.object({
		// Title and description are handled by the identity component
		shipId: z.number().int().default(-1),

		stationId: z.number().optional(),

		state: z.enum(["active", "complete", "cancelled"]).default("active"),
		/** Whether the crew can check off the objective themselves. Defaults to false */
		crewComplete: z.boolean().default(false),
		/** Determines the relative order. Higher priority is a higher number, so 2 is above 1 */
		priority: z.number().default(0),
	})
	.default({});

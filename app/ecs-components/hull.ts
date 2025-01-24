import z from "zod";

/**
 * Hull is the health of the entity
 */
export const hull = z
	.object({
		/**
		 * How much energy the hull is able to withstand before
		 * being destroyed. Measured in gigajoules.
		 */
		hull: z.number().default(10),
	})
	.default({});

import z from "zod";

export const legacyCoolant = z
	.object({
		/** Percent for how full the system's coolant tank is */
		coolant: z.number().default(1),
		/** Multiplier for how fast the coolant is transferred out of this system */
		coolantTransferRate: z.number().default(1),
		/** Multiplier for how fast the coolant is used to cool the system */
		coolantConsumptionRate: z.number().default(1),
		/** Whether the coolant is actively being applied to the heat */
		cooling: z.boolean().default(false),
	})
	.default({});

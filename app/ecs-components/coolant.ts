import z from "zod";

export const coolant = z
	.object({
		/** Percent for how full the system's coolant tank is */
		legacyCoolant: z.number().default(1),
		/** Multiplier for how fast the coolant is transferred out of this system */
		legacyCoolantTransferRate: z.number().default(1),
		/** Multiplier for how fast the coolant is used to cool the system */
		legacyCoolantConsumptionRate: z.number().default(1),
		/** Whether the coolant is actively being applied to the heat */
		cooling: z.boolean().default(false),
	})
	.default({});

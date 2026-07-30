import z from "zod";

export const isCoolantTank = z
	.object({
		/** The actual volume is handled by the heat component */
		/** How much coolant can fit in the reservoir in liters */
		capacity: z.number().default(1000),
		// Default coolant properties are ethylene glycol
		/** The density of the coolant in kg/m^3. Used to determine flow mass and coolant mass. */
		coolantDensity: z.number().default(1113.2),
		/** Specific heat in J/gK. Used to determine how quickly heat flows in and out of coolant. */
		coolantSpecificHeat: z.number().default(2.42),
		/** Which system coolant is being transferred to */
		legacyTransferSystem: z.number().nullable().default(null),
		/** Whether coolant is being transferred into the coolant tank or out of the coolant tank */
		legacyTransferDirection: z.enum(["in", "out"]).default("out"),
	})
	.default({});

export const isCoolantPump = z.object({
	/** How fast the pump pumps at required power in liters/minute */
	baseFlowRate: z.number().default(40000),
});

export const isCoolantRadiator = z.object({
	/** How big the radiator is in square meters */
	area: z.number().default(1),
	/** How much energy is radiated, calculated every frame */
	radiationWatts: z.number().default(0),
});

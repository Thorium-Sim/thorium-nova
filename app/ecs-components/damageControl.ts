import z from "zod";

const damageControlActions = z.union([
	// Electrical
	z.object({ type: z.literal("energize"), duration: z.number().default(10) }),
	// Heat
	z.object({ type: z.literal("extinguish"), duration: z.number().default(10) }),
	z.object({ type: z.literal("cool"), duration: z.number().default(10) }),
	// Structural
	z.object({ type: z.literal("tighten"), duration: z.number().default(10) }),
	z.object({ type: z.literal("align"), duration: z.number().default(10) }),
	// Plumbing
	z.object({ type: z.literal("drain"), duration: z.number().default(10) }),
	z.object({ type: z.literal("weld"), duration: z.number().default(10) }),
	// Radiation
	z.object({ type: z.literal("deionize"), duration: z.number().default(10) }),
	// Contamination
	z.object({ type: z.literal("cleanUp"), duration: z.number().default(10) }),
	// Computer
	z.object({ type: z.literal("debug"), duration: z.number().default(10) }),
	z.object({ type: z.literal("reprogram"), duration: z.number().default(10) }),
	// Corrosion
	z.object({ type: z.literal("polish"), duration: z.number().default(10) }),
	// Fatigue
	z.object({ type: z.literal("dismantle"), duration: z.number().default(10) }),
	z.object({ type: z.literal("reinforce"), duration: z.number().default(10) }),
	// Cryogenic
	z.object({ type: z.literal("warm"), duration: z.number().default(10) }),
]);

const damageControlBaseActions = z.union([
	z.object({ type: z.literal("idle") }),
	z.object({ type: z.literal("goTo"), roomId: z.number() }),
	z.object({
		type: z.literal("retrieveCargo"),
		cargo: z.object({ name: z.string(), count: z.number() }).array(),
	}),
	z.object({ type: z.literal("depositCargo") }),
	z.object({ type: z.literal("useCargo") }),
]);

export const damageControlInstruction = z.union([damageControlBaseActions, damageControlActions]);

export type DamageControlInstructions = z.infer<typeof damageControlInstruction>["type"];

export const damageControlAssignment = z
	.object({
		shipId: z.number().default(-1),
		systemId: z.number().default(-1),
		damageReportId: z.number().default(-1),
		progress: z.number().default(0),
		requiredInventory: z
			.object({ name: z.string(), count: z.number(), present: z.number() })
			.array()
			.default([]),
		requiredAction: damageControlActions.optional(),
	})
	.default({});

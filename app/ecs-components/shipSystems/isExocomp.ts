import { z } from "zod";

export const isExocomp = z.object({}).default({});

export const exocompInstruction = z.union([
	z.object({ type: z.literal("idle") }),
	z.object({ type: z.literal("goTo"), roomId: z.number() }),
	z.object({ type: z.literal("returnHome") }),
	z.object({
		type: z.literal("retrieveCargo"),
		cargo: z.object({ name: z.string(), count: z.number() }).array(),
	}),
	z.object({ type: z.literal("depositCargo") }),
	z.object({ type: z.literal("useCargo") }),
	z.object({ type: z.literal("weld") }),
	z.object({ type: z.literal("reconfigure") }),
	z.object({ type: z.literal("dismantle") }),
	z.object({ type: z.literal("energize") }),
	z.object({ type: z.literal("tighten") }),
	z.object({ type: z.literal("polish") }),
	z.object({ type: z.literal("align") }),
	z.object({ type: z.literal("cleanUp") }),
]);
// Cargo is handled by the cargoContainer component
// Position is handled by the passengerMovement component
// TODO: Attempt to see if we can use the Power component to handle powering the exocomp
export const exocomp = z
	.object({
		shipId: z.number().default(-1),
		instructions: exocompInstruction.array().default([]),
		state: exocompInstruction.default({ type: "idle" }),

		logs: z
			.object({
				timestamp: z.number(),
				text: z.string(),
				state: z.enum(["normal", "warning", "error"]),
			})
			.array()
			.default([]),
		/** Current Charge */
		currentCharge: z.number().default(1),
		maxCharge: z.number().default(1),
	})
	.default({});

export const requiresExocomp = z
	.object({
		progress: z.number().default(0),
		requiredInventory: z.object({ name: z.string(), count: z.number() }).array().default([]),
		requiredAction: z
			.enum([
				"weld",
				"reconfigure",
				"dismantle",
				"energize",
				"tighten",
				"polish",
				"align",
				"cleanUp",
			])
			.default("weld"),
	})
	.default({});

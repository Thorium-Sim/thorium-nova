import { z } from "zod";
export const scanTypes = z.enum([
	"identification",
	"crew",
	"cargo",
	"shields",
	"weapons",
	"targeting",
	"damage",
	"communications",
	"lifeSupport",
]);

export const scanRecord = z.object({
	identification: z
		.object({
			name: z.string(),
			classification: z.string(),
			factionName: z.string(),
		})
		.optional(),
	crew: z
		.object({
			count: z.number(),
		})
		.optional(),
	/** Key is the cargo name, value is the count */
	cargo: z.record(z.number()).optional(),
	shields: z
		.object({
			/** Whether shields are raised or lowered */
			status: z.enum(["up", "down"]).optional(),
			/** Aggregated strength of all the shields */
			strength: z.number().optional(),
		})
		.optional(),
	weapons: z
		.array(
			z.discriminatedUnion("type", [
				z.object({ type: z.literal("phasers"), charge: z.number() }),
				z.object({ type: z.literal("torpedoes"), loaded: z.string() }),
			]),
		)
		.optional(),
	targeting: z
		.object({
			targetName: z.string(),
			targetedSystem: z.string(),
		})
		.optional(),
	/** Key is the system name, value is the efficiency percent. */
	damage: z.record(z.number()).optional(),
	// TODO February 15, 2025: Add this once we have a better idea what communications looks like
	communications: z.object({}),
	// TODO February 15, 2025: Add this once we have a better idea what life support looks like
	lifeSupport: z.object({}),
	passive: z.object({
		/** Temperature of the object in kelvin */
		temperature: z.number(),
		size: z.number(),
		name: z.string(),
	}),
});

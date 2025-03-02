import { z } from "zod";
export const scanTypes = z.enum([
	// For ships
	"identification",
	"crew",
	"cargo",
	"shields",
	"weapons",
	"targeting",
	"damage",
	"communications",
	"lifeSupport",
	// For planets and stars
	"life",
	"atmosphere",
	"temperature",
]);

export const shipScanTypes: z.infer<typeof scanTypes>[] = [
	"identification",
	"crew",
	"cargo",
	"shields",
	"weapons",
	"targeting",
	"damage",
	"communications",
	"lifeSupport",
	"temperature",
];

export const planetScanTypes: z.infer<typeof scanTypes>[] = [
	"life",
	"atmosphere",
	"temperature",
];
export const starScanTypes: z.infer<typeof scanTypes>[] = ["temperature"];

export const scanRecord = z.object({
	identification: z
		.object({
			name: z.string(),
			classification: z.string(),
			factionName: z.string(),
			image: z
				.object({
					type: z.enum(["ship", "planet", "star", "solarSystem", "unknown"]),
					vanity: z.string().optional(),
					hue: z.number().optional(),
					isWhite: z.boolean().optional(),
					cloudMapAsset: z.string().nullish(),
					ringMapAsset: z.string().nullish(),
					textureMapAsset: z.string().optional(),
				})
				.optional(),
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
	life: z
		.object({
			isHabitable: z.boolean(),
			lifeforms: z.string().array(),
			population: z.number(),
		})
		.optional(),
	atmosphere: z
		.array(
			z.object({
				component: z.string(),
				concentration: z.number(),
			}),
		)
		.optional(),
	temperature: z.object({ temperature: z.number() }),
});

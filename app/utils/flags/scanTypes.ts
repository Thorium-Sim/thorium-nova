import z from "zod";
export const scanTypes = z.enum([
	// For ships
	"identification",
	"crew",
	"cargo",
	"shields",
	"weapons",
	"engines",
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
	"engines",
	"targeting",
	"damage",
	"communications",
	"lifeSupport",
	"temperature",
];

export const planetScanTypes: z.infer<typeof scanTypes>[] = [
	"life",
	"communications",
	"atmosphere",
	"temperature",
];
export const starScanTypes: z.infer<typeof scanTypes>[] = ["temperature"];

export const scanRecord = z.object({
	identification: z
		.object({
			scanTime: z.number(),
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
			scanTime: z.number(),
			count: z.number(),
		})
		.optional(),
	cargo: z
		.object({
			scanTime: z.number(),

			/** Key is the cargo name, value is the count */
			cargo: z.record(z.number()),
		})
		.optional(),
	shields: z
		.object({
			scanTime: z.number(),

			/** Whether shields are raised or lowered */
			status: z.enum(["up", "down"]).optional(),
			/** Aggregated strength of all the shields */
			strength: z.number().optional(),
		})
		.optional(),
	weapons: z
		.object({
			scanTime: z.number(),
			weapons: z.array(
				z.discriminatedUnion("type", [
					z.object({ type: z.literal("phasers"), charge: z.number() }),
					z.object({ type: z.literal("torpedoes"), loaded: z.string() }),
				]),
			),
		})
		.optional(),
	engines: z
		.object({
			scanTime: z.number(),
			// In km/s, factors in current power and efficiency
			forwardSpeed: z.number(),
			// In rotations/minute, factors in current power and efficiency
			turnSpeed: z.number(),
		})
		.optional(),
	targeting: z
		.object({
			scanTime: z.number(),
			targetId: z.number(),
			targetName: z.string(),
			targetedSystem: z.string(),
		})
		.optional(),
	damage: z
		.object({
			scanTime: z.number(),
			/** Key is the system name, value is the efficiency percent. */
			damage: z.record(z.number()),
		})
		.optional(),
	communications: z
		.object({
			scanTime: z.number(),
			status: z.string(),
			frequency: z.string(),
		})
		.optional(),
	// TODO February 15, 2025: Add this once we have a better idea what life support looks like
	lifeSupport: z
		.object({
			scanTime: z.number(),
		})
		.optional(),
	life: z
		.object({
			scanTime: z.number(),
			isHabitable: z.boolean(),
			lifeforms: z.string().array(),
			population: z.number(),
		})
		.optional(),
	atmosphere: z
		.object({
			scanTime: z.number(),
			atmosphere: z.array(
				z.object({
					component: z.string(),
					concentration: z.number(),
				}),
			),
		})
		.optional(),
	temperature: z.object({ scanTime: z.number(), temperature: z.number() }).optional(),
});

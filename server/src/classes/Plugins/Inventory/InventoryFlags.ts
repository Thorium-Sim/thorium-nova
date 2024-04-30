import z from "zod";

/**
 * Jumping the gun a bit of this, but I figure it's helpful to have context
 * for how inventory flags work. These repair types came from Thorium Classic.
 **/

export type RepairTypes = z.infer<typeof repairTypes>;

const repairTypes = z.union([
	z.literal("Computer Specialist"),
	z.literal("Custodian"),
	z.literal("Quality Assurance"),
	z.literal("Electrician"),
	z.literal("Explosive Expert"),
	z.literal("Fire Control"),
	z.literal("General Engineer"),
	z.literal("Hazardous Waste"),
	z.literal("Mechanic"),
	z.literal("Plumber"),
	z.literal("Structural Engineer"),
	z.literal("Welder"),
	z.null(),
]);

export const torpedoDamageType = z
	.enum(["explosive", "radiation", "electrical"])
	.default("explosive");
export type TorpedoDamageType = z.infer<typeof torpedoDamageType>;
const torpedoDamageTypeValues = torpedoDamageType._def.innerType._def.values;
export const torpedoGuidanceMode = z
	.enum([
		/** Heat signatures. Works on cloaked ships. */
		"infrared",
		/** Electromagnetic. Most common. */
		"visual",
		/** Works on most metal ships. Weak. */
		"magnetic",
		/** Works on any ship, but very weak. */
		"gravitational",
	])
	.default("visual");

export type TorpedoGuidanceMode = z.infer<typeof torpedoGuidanceMode>;
const torpedoGuidanceModeValues =
	torpedoGuidanceMode._def.innerType._def.values;

// Turn the type above into a zod schema.
export const inventoryFlags = z
	.object({
		fuel: z
			.object({
				/** How much power is released from one unit of fuel in Megawatt Hours */
				fuelDensity: z.number().default(1),
			})
			.optional(),
		coolant: z
			.object({
				// HeatCapacity
				heatCapacity: z.number().default(4.18),
				// Kilograms
				massPerUnit: z.number().default(1000),
			})
			.optional(),
		torpedoCasing: z
			.object({
				color: z.string().optional().default("red"),
				speed: z.number().default(500),
				rotationSpeed: z.number().default(10),
			})
			.optional(),
		torpedoWarhead: z
			.object({
				color: z.string().optional().default("red"),
				yield: z.number().default(1000),
				damageType: torpedoDamageType,
			})
			.optional(),
		torpedoGuidance: z
			.object({
				color: z.string().optional().default("red"),
				guidanceMode: torpedoGuidanceMode,
			})
			.optional(),
		probeCasing: z.object({}).optional(),
		probeEquipment: z.object({}).optional(),
		forCrew: z.object({}).optional(),
		science: z.object({}).optional(),
		// TODO July 1, 2022 - Individual inventory items could be used to heal different kinds of ailments,
		// like poison, radiation, etc. and those can be noted here.
		medical: z.object({}).optional(),
		security: z.object({}).optional(),
		repair: z
			.object({
				/** The type of repair team that this item is used by. */

				type: repairTypes.optional(),
			})
			.default({})
			.optional(),
		sparePart: z
			.object({
				/** Tags to indicate the systems the spare part is used to repair. If left blank it can be used with all systems */
				systemTags: z.array(z.string()).default([]),
			})
			.optional(),
		water: z.object({}).optional(),
	})
	.default({});

export type InventoryFlags = z.infer<typeof inventoryFlags>;

export const InventoryFlagValues: {
	[P in keyof InventoryFlags]: {
		[O in keyof NonNullable<InventoryFlags[P]>]: {
			defaultValue: NonNullable<InventoryFlags[P]>[O];
			info: string;
			options?: string[];
		};
	} & { info: string };
} = {
	fuel: {
		info: "Used by the reactor to generate power.",
		fuelDensity: {
			defaultValue: 1,
			info: "How much power is released from one unit of fuel in MegaWatt Hours.",
		},
	},
	coolant: {
		info: "Cools down things that get hot, like the reactor, engines, and weapons.",
		heatCapacity: {
			defaultValue: 4.18,
			info: "How quickly this coolant heats or cools.",
		},
		massPerUnit: {
			// The mass of 1 m^3 of water.
			defaultValue: 1000,
			info: "The mass of one unit (1 m^3) of the coolant. Used with the heat capacity to determine the heat rate.",
		},
	},
	forCrew: {
		info: "Indicates that this item can be equipped by a crew member.",
	},
	science: {
		info: "Useful for scientific experiments. Mostly just helps assign the item to a room when spawning a ship.",
	},
	medical: {
		info: "Used in the sickbay and by medical teams to heal crew members.",
	},
	security: { info: "Used by security teams to protect the ship." },
	repair: {
		info: "Used by repair teams to repair damaged systems.",
		type: {
			defaultValue: "General Engineer",
			info: "The type of repair team that this item is used by.",
		},
	},
	sparePart: {
		info: "Used by repair teams to repair damaged systems.",
		systemTags: {
			defaultValue: [],
			info: "Tags to indicate the systems the spare part is used to repair. If left blank it can be used with all systems",
		},
	},
	torpedoCasing: {
		info: "Necessary to launch torpedos. Warheads are loaded into the casing before firing.",
		speed: {
			info: "The speed of the torpedo in km/s.",
			defaultValue: 500,
		},
		rotationSpeed: {
			info: "The max rotation speed in rotations per minute.",
			defaultValue: 10,
		},
		color: {
			info: "The color of the torpedo casing. Supports CSS compatible colors.",
			defaultValue: "red",
		},
	},
	torpedoWarhead: {
		info: "What inflicts the damage. Warheads are loaded into the casing before firing.",
		yield: {
			info: "The energy released measured in Kilowatt Hours.",
			defaultValue: 1000,
		},
		damageType: {
			info: "The type of damage the warhead inflicts.",
			defaultValue: "explosive",
			options: torpedoDamageTypeValues,
		},
		color: {
			info: "The color of the torpedo warhead. Supports CSS compatible colors.",
			defaultValue: "red",
		},
	},
	torpedoGuidance: {
		info: "What guides the torpedo to its target. Guidance modules are optionally loaded into the casing before firing.",
		guidanceMode: {
			info: "The guidance mode of the torpedo.",
			defaultValue: "visual",
			options: torpedoGuidanceModeValues,
		},
		color: {
			info: "The color of the torpedo guidance module. Supports CSS compatible colors.",
			defaultValue: "red",
		},
	},
	probeCasing: { info: "Necessary to launch probes." },
	probeEquipment: { info: "Used by the probe to carry equipment." },
};

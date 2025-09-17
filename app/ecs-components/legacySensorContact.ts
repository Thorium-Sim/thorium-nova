import { z } from "zod";

/** 
 Sensor contacts also include
 - identity
 - rotation
 - size
 - color
 - position
 **/

export const isSensorContact = z
	.object({
		/** The ship the contact is associated with */
		shipId: z.number().default(-1),
		/** The sensors system the contact is associated with */
		sensorsId: z.number().default(-1),
		type: z
			.enum(["contact", "planet", "border", "ping", "projectile"])
			.default("contact"),
		icon: z.string().default(""),
		picture: z.string().nullable().default(null),
		speed: z.number().default(0),
		/** Where the contact is moving towards */
		destination: z
			.object({ x: z.number(), y: z.number() })
			.default({ x: 0, y: 0 }),
		/** Whether the contact should appear on infrared sensors */
		infrared: z.boolean().default(false),
		/** The contact remains on core but does not appear on the crew's sensors */
		cloaked: z.boolean().default(false),
		/** Whether the contact is affected by nudges, auto thrusters, or automated movement */
		locked: z.boolean().default(false),
		/** Make the contact appear darkened or broken */
		disabled: z.boolean().default(false),
		destroyed: z.boolean().default(false),

		// For particle detector
		particle: z
			.enum([
				"Dilithium",
				"Tachyon",
				"Neutrino",
				"AntiMatter",
				"Anomaly",

				// Also use this for Science Probe bursts
				"Resonance",
				"Graviton",
				"Lithium",
				"Magnetic",
				"Helium",
				"Hydrogen",
				"Oxygen",
				"Carbon",
				"Radiation",
			])
			.nullable()
			.default(null),

		// For Railguns
		hitpoints: z.number().default(5),
		hostile: z.boolean().default(false),
		autoFire: z.boolean().default(false),
		miss: z.boolean().default(false),

		frozenState: z
			.object({
				new: z.boolean().optional(),
				name: z.string().optional(),
				icon: z.string().optional(),
				picture: z.string().nullable().optional(),
				speed: z.number().optional(),
				infrared: z.boolean().optional(),
				cloaked: z.boolean().optional(),
				locked: z.boolean().optional(),
				disabled: z.boolean().optional(),
				destroyed: z.boolean().optional(),
				removed: z.boolean().optional(),
				size: z.number().optional(),
				destination: z.object({ x: z.number(), y: z.number() }).optional(),
			})
			.nullable()
			.default(null),
	})
	.default({});

export const isArmyContact = z.object({});

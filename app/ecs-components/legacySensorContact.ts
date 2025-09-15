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
		destination: z
			.object({ x: z.number(), y: z.number() })
			.default({ x: 0, y: 0 }),
		infrared: z.boolean().default(false),
		cloaked: z.boolean().default(false),
		locked: z.boolean().default(false),
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
	})
	.default({});

export const isArmyContact = z.object({});

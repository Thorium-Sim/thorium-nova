import {
	torpedoDamageType,
	torpedoGuidanceMode,
} from "@server/classes/Plugins/Inventory/InventoryFlags";
import z from "zod";

export const isTorpedo = z
	.object({
		launcherId: z.number().nullable().default(null),
		targetId: z.number().nullable().default(null),
		/** The energy released measured in Kilowatt Hours */
		yield: z.number().default(1000),
		damageType: torpedoDamageType.nullable().default(null),

		color: z.string().default("white"),

		guidanceMode: torpedoGuidanceMode,

		/** The maximum speed which can move in km/s */
		speed: z.number().default(500),
		/** The max rotation speed in rotations per minute. */
		rotationSpeed: z.number().default(10),
	})
	.default({});

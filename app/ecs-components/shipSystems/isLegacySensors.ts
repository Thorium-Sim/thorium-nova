import { z } from "zod";

export const isLegacySensors = z
	.object({
		pingActive: z.boolean().default(false),
		pingMode: z.enum(["active", "passive", "manual"]).default("active"),
		timeSincePingMs: z.number().default(0),

		autoTargeting: z.boolean().default(false),
		autoThrusters: z.boolean().default(false),
		defaultSpeed: z.number().default(0.2),

		defaultHitpoints: z.number().default(5),
		missPercent: z.number().default(0.25),

		frozen: z.boolean().default(false),
		interference: z.number().default(0),
		movement: z
			.object({ x: z.number(), y: z.number() })
			.default({ x: 0, y: 0 }),
		thrusterMovement: z
			.object({ x: z.number(), y: z.number() })
			.default({ x: 0, y: 0 }),

		segments: z.record(z.boolean()).default({}),

		program: z
			.object({
				type: z.literal("field"),
				density: z.number(),
			})
			.nullable()
			.default(null),
	})
	.default({});

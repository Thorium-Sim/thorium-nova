import z from "zod";

export const physicsWorld = z
	.object({
		enabled: z.boolean().default(true),
		location: z
			.object({
				x: z.number().default(0),
				y: z.number().default(0),
				z: z.number().default(0),
				parentId: z.number().optional(),
			})
			.default({}),
		world: z.any().nullable().default(null),
	})
	.default({});

import z from "zod";

export const collisionWarning = z
	.object({
		objectId: z.number().nullable().default(null),
		timeToCollision: z.number().default(0),
		objectName: z.string().default(""),
	})
	.default({});

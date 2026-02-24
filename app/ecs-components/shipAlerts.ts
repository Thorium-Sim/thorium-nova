import z from "zod";

const shipAlert = z.object({
	id: z.string(),
	/** Discriminator for client-side rendering (e.g. "collision", "power-loss"). */
	type: z.string(),
	priority: z.number(),
	message: z.string(),
	/** Auto-dismiss after this many milliseconds. null = persistent until explicitly removed. */
	duration: z.number().nullable().default(null),
	/** Arbitrary type-specific data (e.g. timeToCollision, objectName). */
	metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ShipAlert = z.infer<typeof shipAlert>;

export const shipAlerts = z
	.object({
		alerts: z.array(shipAlert).default([]),
	})
	.default({});

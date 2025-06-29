import z from "zod";

/**
 * The reputation this entity has with various factions or individual ships
 * 0 is neutral, positive is favorable, negative is unfavorable
 * >= 1000 is an ally, and will assist if in trouble
 * <= -1000 is an enemy, and will attack on sight
 */
export const reputation = z
	.object({ reputation: z.record(z.number()).default({}) })
	.default({ reputation: {} });

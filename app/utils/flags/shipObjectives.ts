import z from "zod";

/**
 * Long-term goals
 * - hold: stay in place
 * - patrol: move within a radius of a point
 * - attack: move towards a target and attack it, regardless of own safety
 * - defend: move towards a target and defend it, regardless of own safety
 * - avoid: move away from a target
 */
export const shipObjectives = z.enum(["hold", "patrol", "follow", "attack", "defend", "avoid"]);

/**
 * Immediate behaviors
 */
export const shipActions = z.enum([
	...shipObjectives.options,
	"firePhasers",
	"fireTorpedo",
	// Move away from the target, load and charge weapons
	"regroup",
	"moveTo",
	"scan",
	"dock",
	"flee",
]);

export const threatScores = z.object({
	score: z.number(),
	distanceScore: z.number(),
	velocityScore: z.number(),
	targetId: z.number().optional(),
	targetingScore: z.number(),
	shieldsScore: z.number(),
	weaponsScore: z.number(),
	factionMultiplier: z.number(),
});

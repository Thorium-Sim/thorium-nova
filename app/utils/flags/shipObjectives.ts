import { z } from "zod";

/**
 * Long-term goals
 * - hold: stay in place
 * - patrol: move within a radius of a point
 * - attack: move towards a target and attack it
 * - defend: move towards a target and defend it
 * - avoid: move away from a target
 */
export const shipObjectives = z.enum([
	"hold",
	"patrol",
	"follow",
	"attack",
	"defend",
	"avoid",
]);

/**
 * Immediate behaviors
 */
export const shipActions = z.enum([
	...shipObjectives.options,
	"moveTo",
	"scan",
	"dock",
]);

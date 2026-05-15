import { shipActions, shipObjectives } from "@thorium/utils/flags/shipObjectives";
import z from "zod";

const target = z
	.union([
		z.null(),
		z.number(),
		z.object({
			parentId: z.number().nullable(),
			x: z.number(),
			y: z.number(),
			z: z.number(),
		}),
	])
	.default(null);

/**
 * Determines what a ship is trying to do
 */
export const shipBehavior = z
	.object({
		/**
		 * The main thing the ship is trying to accomplish
		 */
		objective: shipObjectives.default("hold"),
		/**
		 * The immediate action the ship is performing. The action might change depending
		 * on the ships behavior. For example, a patrol objective might turn into attack
		 * action if the ship finds a high-threat ship.
		 */
		action: shipActions.default("hold"),
		/**
		 * The target of the ship's objective
		 * If it's a number, it's an entity of some kind.
		 * If it's an object, it's a point in space.
		 * If it's null, there is no target.
		 */
		behaviorTarget: target,
		/**
		 * The target of the ship's action
		 * If it's a number, it's an entity of some kind.
		 * If it's an object, it's a point in space.
		 * If it's null, there is no target.
		 */
		actionTarget: target,
		/**
		 * The radius of the sphere where the ship will attempt to patrol,
		 * basically mid-orbit. When patrolling around a planet, set this
		 * to 5 times the planet's radius.
		 */
		patrolRadius: z.number().default(2_500),
	})
	.default({});

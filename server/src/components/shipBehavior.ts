import z from "zod";

/**
 * Determines what a ship is trying to do on the star map
 */
export const shipBehavior = z
	.object({
		/**
		 * The main thing the ship has been instructed to perform
		 * - hold: stay in place
		 * - patrol: move within a radius of a point
		 * - attack: move towards a target and attack it
		 * - defend: move towards a target and defend it
		 */
		objective: z
			.enum(["hold", "patrol", "wander", "attack", "defend"])
			.default("hold"),

		/**
		 * The current action the ship has chosen to take. This is based on
		 * the objective, status, and surroundings of the ship. For
		 * example, if the ship is in a combat situation, it might
		 * attack if it has weapons and shields, and flee if it has
		 * been weakened.
		 */
		action: z
			.enum([
				// Move towards the secondary target
				"engage",
				// Ignore the secondary target
				"disengage",
				// Move away from the secondary target
				"flee",
			])
			.default("disengage"),

		/**
		 * Certain behaviors might need a countdown before they
		 * change the properties of the behavior. For example,
		 * patrol should wait a few seconds before changing
		 * the patrol point.
		 */
		behaviorCooldownSeconds: z.number().default(0),

		/**
		 * The target of the ship's objective
		 * If it's a number, it's an entity of some kind.
		 * If it's an object, it's a point in space.
		 * If it's null, there is no target.
		 */
		target: z
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
			.default(null),

		/**
		 * A secondary target for actions. For example,
		 * a ship might be following ship A, but attacking
		 * ship B. The secondary target can only be another entity.
		 */
		secondaryTarget: z.union([z.null(), z.number()]).default(null),

		/**
		 * The point the ship is currently trying to get to.
		 * This is different from the target, since the target
		 * might be a ship, while this point is somewhere close
		 * to that ship. Or the destination could be another
		 * point in space within a sphere centered around the target.
		 */
		destination: z
			.union([
				z.null(),
				z.object({
					parentId: z.number().nullable(),
					x: z.number(),
					y: z.number(),
					z: z.number(),
				}),
			])
			.default(null),
		/**
		 * The radius of the sphere where the ship will attempt to patrol,
		 * basically mid-orbit. When patrolling around a planet, set this
		 * to 5 times the planet's radius.
		 */
		patrolRadius: z.number().default(2_500),

		/**
		 * The point on a sphere used for calculating the wander direction
		 */
		wanderPoint: z
			.object({
				lat: z.number(),
				lon: z.number(),
			})
			.default({ lat: 0, lon: 0 }),
		/** Whether the rotation autopilot is on. */
		rotationAutopilot: z.boolean().default(true),
		/** Whether the forward movement autopilot is on. */
		forwardAutopilot: z.boolean().default(true),
	})
	.default({});

/**
 * Setting course has the following steps:
 * 1. Open up the starmap and find the destination you want to go to
 * 2. Reticles appear on the viewscreen for the Pilot to line
 *    up with.
 * 3. The pilot lines up the course using Thrusters, and clicks
 *    the "Lock In" button. If the current trajectory is within
 *    a certain threshold, the thruster system is locked and the
 *    ship is now on course.
 * 4. The destination entity is stored; the destination position
 *    is looked up by reference.
 */

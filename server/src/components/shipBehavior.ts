import z from "zod";

/**
 * Determines what a ship is trying to do on the star map
 */
export const shipBehavior = z
	.object({
		/**
		 * The main thing the ship is trying to accomplish
		 * - hold: stay in place
		 * - patrol: move within a radius of a point
		 * - attack: move towards a target and attack it
		 * - defend: move towards a target and defend it
		 */
		objective: z
			.enum(["hold", "patrol", "wander", "attack", "defend"])
			.default("hold"),

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

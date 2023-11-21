import z from "zod";

export const autopilot = z
  .object({
    destinationWaypointId: z.number().nullable().default(null),
    /** The desired coordinates of the ship in the current stage. If desiredSolarSystemId is null, then it's interstellar coordinates */
    desiredCoordinates: z
      .object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      })
      .nullable()
      .default(null),
    /** Desired interstellar system. For when we are traveling from one system to another. */
    desiredSolarSystemId: z.number().nullable().default(null),
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

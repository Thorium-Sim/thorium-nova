import z from "zod";

/**
 * Add this component to indicate an entity's animation should snap instead of interpolate
 * such as when a ship transitions from solar to interstellar space.
 */
export const snapInterpolation = z
  .object({
    snapInterpolation: z.literal(true).default(true),
  })
  .default({});

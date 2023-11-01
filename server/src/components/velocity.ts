import z from "zod";

export const velocity = z
  .object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0),
    /** The measured forward velocity based on the direction of the ship. */
    forwardVelocity: z.number().default(0),
  })
  .default({});

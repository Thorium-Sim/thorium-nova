import z from "zod";

export const isInertialDampeners = z
  .object({
    /** The dampening factor, which affects the speed of the ship based on its current velocity */
    dampening: z.number().default(1),
  })
  .default({});

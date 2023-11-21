import z from "zod";

export const rotationVelocity = z
  .object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0),
  })
  .default({});

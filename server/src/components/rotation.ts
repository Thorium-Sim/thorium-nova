import z from "zod";

export const rotation = z
  .object({
    x: z.number().default(0),
    y: z.number().default(0),
    z: z.number().default(0),
    w: z.number().default(1),
  })
  .default({});

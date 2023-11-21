import z from "zod";

export const population = z
  .object({
    count: z.number().default(0),
  })
  .default({});

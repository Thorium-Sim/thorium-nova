import z from "zod";

export const tags = z
  .object({
    tags: z.array(z.string()).default([]),
  })
  .default({});

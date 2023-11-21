import z from "zod";

export const color = z
  .object({
    color: z.string().default("hsl(0,100%,50%)"),
  })
  .default({});

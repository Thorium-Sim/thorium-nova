import z from "zod";

export const isStatic = z
  .object({
    /** Whether the object is unmoving */
    isStatic: z.literal(true).default(true),
  })
  .default({});

import z from "zod";

export const mass = z
  .object({
    /**
     * The mass of the object in kilograms
     */
    mass: z.number().default(700_000_000),
  })
  .default({});

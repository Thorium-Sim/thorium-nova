import z from "zod";

export const temperature = z
  .object({
    /**
     * Temperature in Kelvin (K)
     */
    temperature: z.number().default(5800),
  })
  .default({});

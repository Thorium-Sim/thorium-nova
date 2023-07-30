import z from "zod";

// Zod schema that matches IdentityComponent
export const identity = z
  .object({
    /**
     * The name of the entity.
     */
    name: z.string().default("Entity"),
    description: z
      .string()
      .default("")
      .describe(
        "Should only be used for information provided by the Flight Director."
      )
      .optional(),
  })
  .default({});

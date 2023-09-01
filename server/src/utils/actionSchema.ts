import z from "zod";

export const componentQuery = z.object({
  component: z.string(),
  property: z.string(),
  comparison: z.string().nullable(),
  value: z.any(),
});

export const valueQuery = z.object({
  query: z.array(componentQuery),
  select: z
    .object({
      component: z.string(),
      property: z.string(),
      matchType: z
        .union([z.literal("all"), z.literal("first"), z.literal("random")])
        .optional(),
    })
    .optional(),
});

export const actionSchema = z
  .array(
    z.object({
      action: z.string(),
      values: z.record(z.union([z.string(), valueQuery])),
    })
  )
  .default([]);

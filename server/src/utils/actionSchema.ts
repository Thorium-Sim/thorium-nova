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
      id: z.string(),
      name: z.string(),
      action: z.string(),
      values: z.record(z.union([z.string(), valueQuery])),
    })
  )
  .default([]);

const eventListener = z.object({
  type: z.literal("eventListener"),
  event: z.string(),
  values: z.record(z.any()).optional(),
});

const distance = z.object({
  type: z.literal("distance"),
  entityA: z.array(componentQuery),
  entityB: z.array(componentQuery),
  distance: z.number(),
  condition: z.union([z.literal("lessThan"), z.literal("greaterThan")]),
});

const entityMatch = z.object({
  type: z.literal("entityMatch"),
  query: z.array(componentQuery),
  matchCount: z.union([z.literal(">=1"), z.string()]),
});

export const conditionSchema = z.discriminatedUnion("type", [
  eventListener,
  distance,
  entityMatch,
]);

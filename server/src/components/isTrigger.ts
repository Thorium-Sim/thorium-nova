import z from "zod";
import {actionSchema, componentQuery} from "../utils/actionSchema";

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
  matchCount: z.union([z.literal(">1"), z.string()]),
});

export const isTrigger = z
  .object({
    active: z.boolean().default(true),
    triggeredAt: z.date().nullable().default(null),
    conditions: z
      .array(
        z.discriminatedUnion("type", [eventListener, distance, entityMatch])
      )
      .default([]),
    actions: actionSchema,
  })
  .default({});

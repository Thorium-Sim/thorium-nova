import z from "zod";
import {actionSchema, conditionSchema} from "../utils/actionSchema";

export const isTrigger = z
  .object({
    active: z.boolean().default(true),
    triggeredAt: z
      .union([z.string(), z.date()])
      .transform(value => new Date(value))
      .nullable()
      .default(null),
    conditions: z.array(conditionSchema).default([]),
    actions: actionSchema,
    stepId: z.number().optional(),
  })
  .default({});

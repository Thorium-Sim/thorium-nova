import { conditionSchema } from "@thorium/utils/flags/actionSchema";
import z from "zod";

export const isTrigger = z
	.object({
		active: z.boolean().default(true),
		multiple: z.boolean().default(false),
		triggeredAt: z
			.union([z.string(), z.date()])
			.transform((value) => new Date(value))
			.nullable()
			.default(null),
		conditions: z.array(conditionSchema).default([]),
		blocks: z.any().array().default([]),
		stepId: z.number().optional(),
		localVariables: z.any().optional(),
	})
	.default({});

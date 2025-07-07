import z from "zod";

export const variables = z
	.object({
		variables: z.array(
			z.discriminatedUnion("type", [
				z.object({
					name: z.string(),
					type: z.literal("any"),
					value: z.any(),
				}),
				z.object({
					name: z.string(),
					type: z.literal("entity"),
					value: z.number(),
				}),
			]),
		),
	})
	.default({ variables: [] });

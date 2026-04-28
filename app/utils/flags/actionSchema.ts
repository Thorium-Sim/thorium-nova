import z from "zod";

export const componentQuery = z.object({
	component: z.string(),
	property: z.string(),
	comparison: z.string().nullish(),
	value: z.any(),
});

export const valueQuery = z.object({
	query: z.array(componentQuery),
	select: z
		.object({
			component: z.string(),
			property: z.string(),
			matchType: z.union([z.literal("all"), z.literal("first"), z.literal("random")]).optional(),
		})
		.optional(),
});

export const actionItem = z.object({
	id: z.string(),
	name: z.string(),
	action: z.string(),
	values: z.record(z.any()),
});
export const actionSchema = z.array(actionItem).default([]);

const eventListener = z.object({
	type: z.literal("eventListener"),
	event: z.string(),
	values: z.record(z.any()).optional(),
});

const distance = z.object({
	type: z.literal("distance"),
	entityA: z.number(),
	entityB: z.number(),
	distance: z.coerce.number(),
	condition: z.union([z.literal("less than"), z.literal("more than")]),
});

const entityMatch = z.object({
	type: z.literal("entityMatch"),
	query: z.array(componentQuery),
	matchCount: z.union([z.literal("any"), z.literal("one"), z.literal("no")]),
});

export const conditionSchema = z.discriminatedUnion("type", [eventListener, distance, entityMatch]);

import z from "zod";

// More flags can be added in the future.
export const nodeFlagsSchema = z.union([
	z.literal("cargo"),
	z.literal("security"),
	z.literal("maintenance"),
	z.literal("medical"),
	z.literal("torpedoStorage"),
	z.literal("probeStorage"),
	z.literal("fuelStorage"),
	z.literal("coolantStorage"),
	z.literal("waterStorage"),
	z.literal("lifeSupport"),
	z.literal("crewQuarters"),
	z.literal("cafeteria"),
	z.literal("recreation"),
	z.literal("science"),
]);

export const nodeFlags = nodeFlagsSchema._def.options.map(
	(flag) => flag._def.value,
);
export type NodeFlag = z.infer<typeof nodeFlagsSchema>;

import z from "zod";

export const edgeFlagsSchema = z.union([
	z.literal("cargoOnly"),
	z.literal("crewOnly"),
	z.literal("botsOnly"),
]);
export const edgeFlags = edgeFlagsSchema._def.options.map(
	(flag) => flag._def.value,
);
export type EdgeFlag = z.infer<typeof edgeFlagsSchema>;

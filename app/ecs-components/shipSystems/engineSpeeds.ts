import z from "zod";
export const engineSpeeds = z
	.object({ label: z.string(), number: z.string() })
	.array();

export type EngineSpeed = z.infer<typeof engineSpeeds>[number];

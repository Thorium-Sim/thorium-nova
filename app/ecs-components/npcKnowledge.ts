import z from "zod";

export const npcKnowledge = z
	.object({
		alertLevel: z.string().optional(),
		passiveRange: z.number().optional(),
		activeRange: z.number().optional(),
		weaponsRange: z.number().optional(),
		threats: z.map(z.number(), z.number()).default(new Map()),
	})
	.default({});

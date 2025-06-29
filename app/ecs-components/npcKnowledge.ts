import { threatScores } from "@thorium/utils/flags/shipObjectives";
import z from "zod";

export const npcKnowledge = z
	.object({
		passiveRange: z.number().optional(),
		activeRange: z.number().optional(),
		weaponsRange: z.number().optional(),
		threats: z.map(z.number(), threatScores).default(new Map()),
	})
	.default({});

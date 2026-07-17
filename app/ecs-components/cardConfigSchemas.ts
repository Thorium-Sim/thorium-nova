import { engineeringPanelElementConfig } from "@thorium/ecs-components/engineeringPanelElementConfig";
import z from "zod";

export const baseCard = z.object({
	name: z.string(),
	icon: z.string().nullish().optional(),
	component: z.string(),
	highlight: z.boolean().default(false).optional(),
	config: z.any().optional(),
});
export const engineeringPanelsCard = baseCard.extend({
	component: z.literal("EngineeringPanels"),
	config: z
		.discriminatedUnion("type", [
			z.object({
				// Used during the flight to reference the panel entity
				panelId: z.number().optional(),
				type: z.literal("manual"),
				elementCount: z.number(),
				elementNameTemplate: z.string(),
				randomSeed: z.string().optional().default("thorium"),
				tags: z.string().array().optional(),
			}),
			z.object({
				// Used during the flight to reference the panel entity
				panelId: z.number().optional(),
				type: z.literal("automatic"),
				elements: z
					.intersection(
						engineeringPanelElementConfig,
						z.object({
							name: z.string(),
						}),
					)
					.array(),
				tags: z.string().array().optional(),
			}),
		])
		.optional(),
});

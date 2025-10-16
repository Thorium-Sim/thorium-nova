import { damageEffectsObject } from "@thorium/ecs-components/shipSystems/damageEffectsObject";
import { damageTypes } from "@thorium/utils/flags/damageTypes";
import z from "zod";

// The damage report itself is handled through the timeline component
export const damageReport = z.object({
	shipId: z.number(),
	systemId: z.number(),
	damageType: damageTypes,
	affectedSystems: z
		.object({
			id: z.number(),
			name: z.string(),
			effects: damageEffectsObject,
		})
		.array(),
});

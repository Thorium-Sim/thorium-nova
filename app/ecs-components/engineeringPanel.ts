import { engineeringPanelElementConfig } from "@thorium/ecs-components/engineeringPanelElementConfig";
import z from "zod";

const cableHandle = z.object({
	elementId: z.number(),
	portIndex: z.number(),
});
export const isPanel = z
	.object({
		shipId: z.number().default(-1),
		cables: z
			.object({
				id: z.string(),
				color: z.string(),
				handles: z.tuple([cableHandle, cableHandle]),
			})
			.array()
			.default([]),
	})
	.default({});

export const isPanelElement = z
	.object({
		element: engineeringPanelElementConfig,
		state: z.number().default(0),
		shipId: z.number().default(-1),
		panelId: z.number().default(-1),
	})
	.default({});

export const panelAssignment = z.object({
	shipId: z.number().default(-1),
	systemId: z.number().default(-1),
	damageReportId: z.number().default(-1),
	panelId: z.number().default(-1),
	progress: z.number().default(0),
	elements: z
		.object({
			id: z.number(),
			requiredState: z.number(),
			requiredDuration: z.number().default(0),
			requiredCount: z.number().default(0),
			// For validating cable connections
			requiredConnection: z
				.tuple([
					z.object({ elementId: z.number(), portIndex: z.number() }),
					z.object({ elementId: z.number(), portIndex: z.number() }),
				])
				.optional(),
			progress: z.number().default(0),
			complete: z.boolean().default(false),
		})
		.array()
		.default([]),
});

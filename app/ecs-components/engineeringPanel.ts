import { z } from "zod";

const panelElementTypes = z.enum([
	"toggleButton",
	"pressButton",
	"numberedButton",
	"switch",
	"numberedRotor",
	"numberedSlider",
	"cableSocket",
	"triSwitch",
	"numberPad",
]);

export const isPanel = z.object({}).default({});

export const isPanelElement = z
	.object({
		type: panelElementTypes.default("toggleButton"),
		state: z.number().default(0),
		shipId: z.number().default(-1),
		panelId: z.number().default(-1),
	})
	.default({});

export const panelAssignment = z.object({
	shipId: z.number().default(-1),
	systemId: z.number().default(-1),
	damageReportId: z.number().default(-1),
	progress: z.number().default(0),
	elements: z
		.object({
			id: z.number(),
			requiredState: z.number(),
			requiredDuration: z.number().default(0),
			progress: z.number().default(0),
			complete: z.boolean().default(false),
		})
		.array()
		.default([]),
});

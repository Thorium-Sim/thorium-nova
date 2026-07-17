import z from "zod";

export const engineeringPanelElementConfig = z
	.union([
		z.object({ type: z.literal("pressButton"), color: z.string().default("red") }),
		z.object({ type: z.literal("switch"), color: z.string().default("red") }),
		// TODO July 17, 2026 - The rotor component has issues, so we're removing it for now.
		// z.object({ type: z.literal("numberedRotor"), max: z.number().default(6) }),
		z.object({ type: z.literal("numberedSlider"), max: z.number() }),
		z.object({ type: z.literal("cableSocket"), ports: z.number() }),
		z.object({ type: z.literal("triSwitch") }),
		z.object({ type: z.literal("numberPad") }),
	])
	.default({ type: "triSwitch" });

export const panelElementList = engineeringPanelElementConfig._def.innerType._def.options.map(
	(o) => o._def.shape().type._def.value,
);

export type PanelElementTypes = (typeof panelElementList)[number];

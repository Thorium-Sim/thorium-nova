import { baseCard, engineeringPanelsCard } from "@thorium/ecs-components/cardConfigSchemas";
import z from "zod";

const widgetProps = {
	size: z.enum(["sm", "md", "lg", "xl"]).optional(),
	resize: z.boolean().optional(),
};

export const stationSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	logo: z.string().optional(),
	theme: z.string().optional(),
	tags: z.string().array().optional(),
	cards: z.union([baseCard, engineeringPanelsCard]).array(),
	widgets: z
		.union([baseCard.extend(widgetProps), engineeringPanelsCard.extend(widgetProps)])
		.array(),
	messageGroups: z.string().array().default([]),
});

export const stationComplementSchema = z.object({
	name: z.string(),
	hasShipMap: z.boolean(),
	assets: z.object({}),
	flightMode: z.enum(["nova", "legacy"]),
	stations: stationSchema.array(),
});

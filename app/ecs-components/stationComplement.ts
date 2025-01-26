import z from "zod";

const card = z.object({
	name: z.string().default("Card"),
	component: z.string().default("Login"),
	config: z.any().optional(),
	icon: z.string().nullable().optional(),
});

const widget = z.object({
	name: z.string().default("Remote Access"),
	component: z.string().default("RemoteAccess"),
	config: z.any().optional(),
	icon: z.string().nullable().optional(),
	size: z.enum(["sm", "md", "lg", "xl"]).default("md").optional(),
	resize: z.boolean().default(false).optional(),
});

const station = z.object({
	name: z.string().default("Station"),
	description: z.string().default(""),
	logo: z.string().default(""),
	theme: z.string().default("Default"),
	tags: z.array(z.string()).default([]),
	cards: z.array(card).default([]),
	widgets: z.array(widget).default([]),
});

export const stationComplement = z
	.object({
		stations: z.array(station).default([]),
	})
	.default({});

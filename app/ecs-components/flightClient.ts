import z from "zod";

export const flightClient = z
	.object({
		clientId: z.string().default(""),
		flightId: z.string().default(""),
		shipId: z.number().nullable().default(null),
		stationId: z.string().nullable().default(null),
		currentCard: z.string().nullable().default(null),
		loginName: z.string().default(""),
		offlineState: z
			.object({ title: z.string(), message: z.string().optional() })
			.nullable()
			.default(null),
		training: z
			.object({
				card: z.string().optional(),
				selector: z.string().array().optional(),
				text: z.string(),
				mediaUrl: z.string().optional(),
				timelineId: z.number().optional(),
				allowAdvance: z.boolean().default(false),
			})
			.nullable()
			.default(null),
		bridgeAssigned: z.boolean().default(false),
		officersLog: z
			.object({
				timestamp: z.number(),
				message: z.string(),
			})
			.array()
			.default([]),
		stationOverride: z
			.object({
				name: z.string(),
				logo: z.string().optional(),
				cards: z
					.object({
						name: z.string(),
						icon: z.string().optional(),
						component: z.string(),
					})
					.array(),
				widgets: z
					.object({
						name: z.string(),
						component: z.string(),
						icon: z.string(),
						size: z.enum(["sm", "md", "lg", "xl"]),
					})
					.array(),
				messageGroups: z.string().array(),
			})
			.nullable()
			.optional(),
	})
	.default({});

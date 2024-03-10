import z from "zod";
import {
	edgeFlagsSchema,
	nodeFlagsSchema,
} from "../../classes/Plugins/Ship/Deck";

const roundTo1000 = (num: number) => Math.round(num * 1000) / 1000;

export const shipMap = z
	.object({
		decks: z
			.array(
				z.object({
					backgroundUrl: z.string().optional(),
					name: z.string().default("Deck"),
				}),
			)
			.default([]),
		deckNodes: z
			.array(
				z.object({
					id: z.number(),
					deckIndex: z.number(),
					x: z.number().transform((val) => roundTo1000(val)),
					y: z.number().transform((val) => roundTo1000(val)),
					name: z.string().optional(),
					icon: z.string().optional(),
					isRoom: z.boolean().optional(),
					radius: z.number().optional(),
					contents: z.record(
						z.object({
							count: z.number(),
							temperature: z.number(),
						}),
					),
					flags: nodeFlagsSchema.array().optional(),
					volume: z.number().optional(),
					systems: z.string().array().optional(),
				}),
			)
			.default([]),
		deckEdges: z
			.array(
				z.object({
					id: z.number(),
					from: z.number(),
					to: z.number(),
					weight: z.number().optional(),
					isOpen: z.boolean().optional(),
					flags: edgeFlagsSchema.array().optional(),
				}),
			)
			.default([]),
	})
	.default({});

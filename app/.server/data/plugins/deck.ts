import path from "node:path";

import type ShipPlugin from "@thorium/.server/classes/Plugins/Ship";
import type { DeckEdge, DeckNode } from "@thorium/.server/classes/Plugins/Ship/Deck";
import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import inputAuth from "@thorium/utils/.server/inputAuth";
import { edgeFlagsSchema } from "@thorium/utils/flags/DeckEdge";
import { nodeFlagsSchema } from "@thorium/utils/flags/DeckNode";
import { generateIncrementedName } from "@thorium/utils/generateIncrementedName";
import { moveArrayItem } from "@thorium/utils/operations/moveArrayItem";
import uniqid from "@thorium/utils/uniqid";
import z from "zod";

import { getPlugin } from "./utils";
function getDeck(
	context: DataContext,
	{ pluginId, shipId, deckId }: { pluginId: string; shipId: string; deckId: string },
) {
	const plugin = getPlugin(context, pluginId);
	const ship = plugin.aspects.ships.find((ship) => ship.name === shipId);
	if (!ship) throw new Error("Ship not found");

	const deck = ship.decks.find((deck) => deck.name === deckId);
	if (!deck) throw new Error("Deck not found");
	return { ship, deck };
}
function getNextDeckId(ship: ShipPlugin) {
	const deckIds = ship.decks.flatMap((deck) => deck.nodes.map((node) => node.id));
	return Math.max(0, ...deckIds) + 1;
}
function getNextEdgeId(ship: ShipPlugin) {
	const edgeIds = ship.deckEdges.map((edge) => edge.id);
	return Math.max(0, ...edgeIds) + 1;
}

export const deck = t.router({
	create: t.procedure
		.input(z.object({ pluginId: z.string(), shipId: z.string() }))
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return null;

			const deckIndex = ship.addDeck({});

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
			return deckIndex;
		}),
	delete: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				deckId: z.string(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) return;

			const deckIndex = ship.decks.findIndex((deck) => deck.name === input.deckId);
			ship.removeDeck(deckIndex);

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
		}),
	update: t.procedure
		.input(
			z.intersection(
				z.object({
					pluginId: z.string(),
					shipId: z.string(),
					deckId: z.string(),
				}),
				z.union([
					z.object({ generateName: z.string() }),
					z.object({ newName: z.string() }),
					z.object({ newIndex: z.number() }),
					z.object({
						backgroundImage: z.instanceof(File).nullish(),
					}),
				]),
			),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const { ship, deck } = getDeck(ctx, input);

			const deckIndex = ship.decks.findIndex((deck) => deck.name === input.deckId);
			if ("generateName" in input) {
				deck.name = generateIncrementedName(
					input.generateName,
					ship.decks.map((deck) => deck.name),
				);
			}
			if ("newName" in input) {
				deck.name = input.newName;
			}
			if ("newIndex" in input && typeof input.newIndex === "number") {
				moveArrayItem(ship.decks, deckIndex, input.newIndex);
			}
			if ("backgroundImage" in input && input.backgroundImage instanceof File) {
				const ext = path.extname(input.backgroundImage.name);
				const file = input.backgroundImage;
				const filePath = `${deck.name}${ext}`;
				if (!ship) return;
				deck.backgroundUrl = await ctx.uploadFile.call(ship, file, filePath);
				ship.write();
			}
			if ("backgroundImage" in input && input.backgroundImage === null) {
				await ctx.removeFile(deck.backgroundUrl);
				deck.backgroundUrl = "";
				ship.write(true);
			}

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});

			return deck;
		}),
	addNode: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				deckId: z.string(),
				x: z.number(),
				y: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const { ship, deck } = getDeck(ctx, input);
			const node: DeckNode = {
				x: input.x,
				y: input.y,
				id: getNextDeckId(ship),
				contents: {},
				flags: [],
				icon: "",
				isRoom: false,
				name: "",
				radius: 0,
				systems: [],
				volume: 12000,
			};
			deck.nodes.push(node);

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
			return node;
		}),
	removeNode: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				deckId: z.string(),
				nodeId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const { ship, deck } = getDeck(ctx, input);
			const node = deck.nodes.find((node) => node.id === input.nodeId);
			if (!node) return;

			// Remove any connected edges.
			ship.deckEdges = ship.deckEdges.filter((edge) => {
				const { from, to } = edge;
				return node.id !== from && node.id !== to;
			});
			deck.nodes = deck.nodes.filter((node) => node.id !== input.nodeId);

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
		}),
	updateNode: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				deckId: z.string(),
				nodeId: z.number(),
				x: z.number().optional(),
				y: z.number().optional(),
				name: z.string().optional(),
				isRoom: z.boolean().optional(),

				icon: z.instanceof(File).nullish().optional(),

				radius: z.number().optional(),
				volume: z.number().optional(),
				flags: nodeFlagsSchema.array().optional(),
				systems: z.string().array().optional(),
			}),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const { ship, deck } = getDeck(ctx, input);
			const node = deck.nodes.find((node) => node.id === input.nodeId);
			if (!node) return;

			if (typeof input.x !== "undefined") {
				node.x = input.x;
			}
			if (typeof input.y !== "undefined") {
				node.y = input.y;
			}
			if (typeof input.name !== "undefined") {
				node.name = input.name;
			}
			if (typeof input.isRoom !== "undefined") {
				node.isRoom = input.isRoom;
			}
			if (typeof input.icon !== "undefined") {
				const file = input.icon;
				if (file instanceof File) {
					const ext = path.extname(file.name);
					const filePath = `${uniqid(`node-${node.id}`)}${ext}`;
					node.icon = await ctx.uploadFile.call(ship, file, filePath);
					ship.write(true);
				}
			}
			if (typeof input.radius !== "undefined") {
				node.radius = input.radius;
			}
			if (typeof input.flags !== "undefined") {
				node.flags = input.flags;
			}
			if (typeof input.systems !== "undefined") {
				node.systems = input.systems;
			}
			if (typeof input.volume !== "undefined") {
				if (input.volume < 0) {
					node.volume = 0;
				}
				node.volume = input.volume;
			}

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});

			return node;
		}),
	addEdge: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				from: z.number(),
				to: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) throw new Error("Ship not found");
			// See if there are already any edges between these two points
			const existingEdge = ship.deckEdges.find(
				(e) =>
					(e.from === input.from && e.to === input.to) ||
					(e.from === input.to && e.to === input.from),
			);
			if (existingEdge) return existingEdge;
			const edge: DeckEdge = {
				from: input.from,
				to: input.to,
				id: getNextEdgeId(ship),
				flags: [],
				isOpen: true,
				weight: 1,
			};
			ship.deckEdges.push(edge);

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
			return edge;
		}),
	removeEdge: t.procedure
		.input(
			z.object({
				pluginId: z.string(),
				shipId: z.string(),
				edgeId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) throw new Error("Ship not found");

			const edge = ship.deckEdges.find((edge) => edge.id === input.edgeId);
			if (!edge) return;

			ship.deckEdges = ship.deckEdges.filter((edge) => edge.id !== input.edgeId);

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});
		}),
	updateEdge: t.procedure
		.input(
			z.intersection(
				z.object({
					pluginId: z.string(),
					shipId: z.string(),
					edgeId: z.number(),
				}),
				z.union([z.object({ weight: z.number() }), z.object({ flags: edgeFlagsSchema.array() })]),
			),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find((ship) => ship.name === input.shipId);
			if (!ship) throw new Error("Ship not found");

			const edge = ship.deckEdges.find((edge) => edge.id === input.edgeId);
			if (!edge) return;

			if ("weight" in input) {
				edge.weight = input.weight;
			}
			if ("flags" in input) {
				edge.flags = input.flags;
			}

			pubsub.publish.plugin.ship.get({
				pluginId: input.pluginId,
				shipId: ship.name,
			});

			return edge;
		}),
});

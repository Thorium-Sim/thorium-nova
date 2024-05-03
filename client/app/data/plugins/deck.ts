import type ShipPlugin from "@server/classes/Plugins/Ship";
import { t } from "@server/init/t";
import { pubsub } from "@server/init/pubsub";
import { generateIncrementedName } from "@server/utils/generateIncrementedName";
import inputAuth from "@server/utils/inputAuth";
import { moveArrayItem } from "@server/utils/moveArrayItem";
import type { DataContext } from "@server/utils/types";
import { z } from "zod";
import { getPlugin } from "./utils";
import path from "node:path";
import fs from "node:fs/promises";
import uniqid from "@thorium/uniqid";
import { thoriumPath } from "@server/utils/appPaths";
import {
	DeckEdge,
	DeckNode,
	edgeFlagsSchema,
	nodeFlagsSchema,
} from "@server/classes/Plugins/Ship/Deck";
function getDeck(
	context: DataContext,
	{
		pluginId,
		shipId,
		deckId,
	}: { pluginId: string; shipId: string; deckId: string },
) {
	const plugin = getPlugin(context, pluginId);
	const ship = plugin.aspects.ships.find((ship) => ship.name === shipId);
	if (!ship) throw new Error("Ship not found");

	const deck = ship.decks.find((deck) => deck.name === deckId);
	if (!deck) throw new Error("Deck not found");
	return { ship, deck };
}
function getNextDeckId(ship: ShipPlugin) {
	const deckIds = ship.decks.flatMap((deck) =>
		deck.nodes.map((node) => node.id),
	);
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
			const ship = plugin.aspects.ships.find(
				(ship) => ship.name === input.shipId,
			);
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
			z.object({ pluginId: z.string(), shipId: z.string(), index: z.number() }),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find(
				(ship) => ship.name === input.shipId,
			);
			if (!ship) return;

			ship.removeDeck(input.index);

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
						backgroundImage: z.union([
							z.string(),
							z.instanceof(File),
							z.null(),
						]),
					}),
				]),
			),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const { ship, deck } = getDeck(ctx, input);

			const deckIndex = ship.decks.findIndex(
				(deck) => deck.name === input.deckId,
			);
			if ("generateName" in input) {
				deck.name = generateIncrementedName(
					input.generateName,
					ship.decks.map((deck) => deck.name),
				);
			}
			if ("newName" in input) {
				deck.name = input.newName;
				ship.writeFile(true);
			}
			if ("newIndex" in input && typeof input.newIndex === "number") {
				moveArrayItem(ship.decks, deckIndex, input.newIndex);
			}
			if (
				"backgroundImage" in input &&
				typeof input.backgroundImage === "string"
			) {
				const ext = path.extname(input.backgroundImage);
				const file = input.backgroundImage;
				const filePath = `${uniqid(`deck-${deck.name}-`)}${ext}`;
				if (!ship) return;
				if (typeof file === "string") {
					await fs.mkdir(path.join(thoriumPath, ship.assetPath), {
						recursive: true,
					});
					await fs.rename(
						file,
						path.join(thoriumPath, ship.assetPath, filePath),
					);
					deck.backgroundUrl = path.join(ship.assetPath, filePath);
					ship.writeFile(true);
				}
			}
			if ("backgroundImage" in input && input.backgroundImage === null) {
				const oldAsset = deck.backgroundUrl;
				if (oldAsset) {
					await fs.unlink(path.join(thoriumPath, oldAsset));
				}
				deck.backgroundUrl = "";
				ship.writeFile(true);
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
			const node = new DeckNode({
				x: input.x,
				y: input.y,
				id: getNextDeckId(ship),
			});
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
			z.intersection(
				z.object({
					pluginId: z.string(),
					shipId: z.string(),
					deckId: z.string(),
					nodeId: z.number(),
				}),
				z.union([
					z.object({ x: z.number(), y: z.number() }),
					z.object({ name: z.string() }),
					z.object({ isRoom: z.boolean() }),
					z.object({
						icon: z.union([z.string(), z.instanceof(File), z.null()]),
					}),
					z.object({ radius: z.number() }),
					z.object({ volume: z.number() }),
					z.object({ flags: nodeFlagsSchema.array() }),
					z.object({ systems: z.string().array() }),
				]),
			),
		)
		.send(async ({ ctx, input }) => {
			inputAuth(ctx);
			const { ship, deck } = getDeck(ctx, input);
			const node = deck.nodes.find((node) => node.id === input.nodeId);
			if (!node) return;

			if ("x" in input) {
				node.x = input.x;
				node.y = input.y;
			}
			if ("name" in input) {
				node.name = input.name;
			}
			if ("isRoom" in input) {
				node.isRoom = input.isRoom;
			}
			if ("icon" in input) {
				const file = input.icon;
				if (typeof file === "string") {
					const ext = path.extname(file);
					const filePath = `${uniqid(`node-${node.id}`)}${ext}`;
					await fs.mkdir(path.join(thoriumPath, ship.assetPath), {
						recursive: true,
					});
					await fs.rename(
						file,
						path.join(thoriumPath, ship.assetPath, filePath),
					);
					node.icon = path.join(ship.assetPath, filePath);
					ship.writeFile(true);
				}
			}
			if ("radius" in input) {
				node.radius = input.radius;
			}
			if ("flags" in input) {
				node.flags = input.flags;
			}
			if ("systems" in input) {
				node.systems = input.systems;
			}
			if ("volume" in input) {
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
			const ship = plugin.aspects.ships.find(
				(ship) => ship.name === input.shipId,
			);
			if (!ship) throw new Error("Ship not found");

			const edge = new DeckEdge({
				from: input.from,
				to: input.to,
				id: getNextEdgeId(ship),
			});
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
			const ship = plugin.aspects.ships.find(
				(ship) => ship.name === input.shipId,
			);
			if (!ship) throw new Error("Ship not found");

			const edge = ship.deckEdges.find((edge) => edge.id === input.edgeId);
			if (!edge) return;

			ship.deckEdges = ship.deckEdges.filter(
				(edge) => edge.id !== input.edgeId,
			);

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
				z.union([
					z.object({ weight: z.number() }),
					z.object({ flags: edgeFlagsSchema.array() }),
				]),
			),
		)
		.send(({ ctx, input }) => {
			inputAuth(ctx);
			const plugin = getPlugin(ctx, input.pluginId);
			const ship = plugin.aspects.ships.find(
				(ship) => ship.name === input.shipId,
			);
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

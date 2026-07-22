import { ShipSystemTypes } from "@thorium/.server/classes/Plugins/ShipSystems/shipSystemTypes";
import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { findClosestNode } from "@thorium/.server/systems/PassengerMovementSystem";
import type { shipMap } from "@thorium/ecs-components/shipMap";
import {
	getInventoryTemplates,
	getPluginInventoryTemplates,
} from "@thorium/utils/.server/getInventoryTemplates";
import { getGraph } from "@thorium/utils/.server/ship/shipMapGraph";
import { calculateShipMapPath } from "@thorium/utils/.server/ship/shipMapPathfinder";
import type { ECS, Entity } from "@thorium/utils/ecs";
import { nodeFlags, nodeFlagsSchema, type NodeFlag } from "@thorium/utils/flags/DeckNode";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { matchSorter } from "match-sorter";
import z from "zod";

type ShipMapDeckNode = z.infer<typeof shipMap>["deckNodes"][number];

const transferId = z.object({
	type: z.union([z.literal("room"), z.literal("entity")]),
	shipId: z.number(),
	id: z.number(),
});

const cargoRoomsCache = new Map<Entity, ShipMapDeckNode[]>();

const deckRoomOutput = z.object({
	shipId: z.number(),
	deckName: z.string(),
	deckIndex: z.number(),
	roomName: z.string(),
	roomId: z.number(),
});
export const cargoControl = t.router({
	inventoryTypes: t.procedure
		.autoPublish([], () => null)
		.request(({ ctx }) => {
			for (const system of ctx.ecs.systems) {
				if (system.constructor.name === "FilterInventorySystem") {
					return Object.fromEntries(
						Array.from(system?.entities.entries()).map(([_, entity]) => [
							entity.components.identity?.name,
							{
								...entity.components.identity,
								...entity.components.isInventory,
							},
						]) || [],
					);
				}
			}

			return {};
		}),
	rooms: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number } | null, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(["shipMap"], (entity) => entity.components.shipMap && { shipId: entity.id })
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("No ship selected");
			const rooms = getCargoRooms(ship);
			const decks = ship.components.shipMap?.decks || [];
			return {
				rooms,
				decks,
				shipLength: ship.components.size?.length || 100,
			};
		}),
	containers: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number } | null, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(["isCargoContainer", "passengerMovement"], (entity) =>
			entity.components.cargoContainer && entity.components.position?.parentId
				? { shipId: entity.components.position.parentId }
				: null,
		)
		.request(({ ctx, input }) => {
			const inventoryTemplates = getInventoryTemplates(ctx.ecs);
			const matchEntities = [...(ctx.ecs.componentCache.get("isCargoContainer") || [])];
			return (
				matchEntities
					.filter(
						(entity) =>
							entity.components.position?.parentId === input.shipId &&
							entity.components.cargoContainer &&
							entity.components.position &&
							entity.components.passengerMovement,
					)
					.map((entity) => {
						const entityState: "idle" | "enRoute" =
							entity.components.passengerMovement?.nodePath.length === 0 ? "idle" : "enRoute";
						return {
							id: entity.id,
							name: entity.components.identity?.name || `Container ${entity.id}`,
							position: entity.components.position,
							contents: entity.components.cargoContainer?.contents || {},
							used: calculateCargoUsed(
								entity.components.cargoContainer?.contents || {},
								inventoryTemplates,
							),
							volume: entity.components.cargoContainer?.volume || 0,
							destinationNode: entity.components.passengerMovement?.destinationNode || null,
							entityState,
						};
					}) || []
			);
		}),
	search: t.procedure
		.input(z.object({ shipId: z.number(), query: z.string() }))
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("No ship selected");

			const output: {
				id: number;
				type: "deck" | "room" | "inventory";
				room?: string;
				count?: number;
				roomId?: number;
				name: string;
				deck: string;
				deckIndex: number;
				systemFlags: string[];
			}[] = [];
			// We're searching for decks, rooms, and cargo items.
			// First decks.
			ship.components.shipMap?.decks.forEach((deck, i) => {
				output.push({
					id: i,
					type: "deck",
					name: deck.name,
					deck: deck.name,
					deckIndex: i,
					systemFlags: [],
				});
			});

			// Then rooms.
			ship.components.shipMap?.deckNodes.forEach((node) => {
				if (node.isRoom && node.flags?.includes("cargo")) {
					output.push({
						id: node.id,
						type: "room",
						name: node.name || "",
						roomId: node.id,
						deck: ship.components.shipMap?.decks[node.deckIndex].name || "",
						deckIndex: node.deckIndex,
						systemFlags: node.systems,
					});

					// And the cargo items in the room.
					Object.entries(node.contents).forEach(([name, { count }], i) => {
						if (count === 0) return;
						output.push({
							id: Number(`${node.id}${i}${count}`),
							type: "inventory",
							name,
							room: node.name,
							roomId: node.id,
							count,
							deck: ship.components.shipMap?.decks[node.deckIndex].name || "",
							deckIndex: node.deckIndex,
							systemFlags: [],
						});
					});
				}
			});

			return matchSorter(output, input.query, { keys: ["name", "systemFlags"] }).slice(0, 10);
		}),
	stream: t.procedure.input(z.object({ shipId: z.number() })).dataStream(({ input, ctx }) => {
		const set = new Set<Entity>();
		for (let entity of ctx.ecs.componentCache.get("isCargoContainer") || []) {
			if (
				entity.components.position?.parentId === input.shipId &&
				entity.components.passengerMovement
			) {
				set.add(entity);
			}
		}
		return set;
	}),
	containerSummon: t.procedure
		.input(
			z.object({
				shipId: z.number(),
				roomId: z.number(),
				containerId: z.number().optional(),
			}),
		)
		.meta({ event: true })
		.output(
			z.object({
				shipId: z.number(),
				roomId: z.number(),
				containerId: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("No ship selected");
			if (!ship.components.shipMap) throw new Error("Invalid ship map.");
			const graph = getGraph(ship);
			const room = ship.components.shipMap?.deckNodes.find((d) => d.id === input.roomId);
			if (!room) throw new Error("No room found");

			let container: Entity | null | undefined;
			if (typeof input.containerId === "number") {
				container = ctx.flight?.ecs.getEntityById(input.containerId);
			} else {
				const matchEntities = [...(ctx.ecs.componentCache.get("isCargoContainer") || [])];
				// Find the closest container.
				container = matchEntities.reduce((acc: Entity | null, entity) => {
					if (
						!entity.components.cargoContainer ||
						!entity.components.position ||
						entity.components.position.parentId !== input.shipId
					)
						return acc;
					if (!acc) return entity;

					// If the entity is busy, skip it
					if (entity.components.passengerMovement?.nodePath.length) return acc;

					// Prioritize entities that are close to the target deck, but not busy.
					if (
						Math.abs(room.deckIndex - (acc.components.position?.z ?? Number.POSITIVE_INFINITY)) <
						Math.abs(room.deckIndex - entity.components.position.z)
					) {
						// If the acc entity is not busy, use it.
						return acc;
					}
					let accDistance = Number.POSITIVE_INFINITY;
					if (acc?.components.position) {
						const { x, y } = acc.components.position;
						accDistance = Math.hypot(room.x - x, room.y - y);
					}
					let entityDistance = Number.POSITIVE_INFINITY;
					if (entity.components.position) {
						const { x, y } = entity.components.position;
						entityDistance = Math.hypot(room.x - x, room.y - y);
					}
					if (entityDistance < accDistance) {
						return entity;
					}
					return acc;
				}, null);
			}

			if (!container?.components.position) throw new Error("No container available.");

			const closestNode = findClosestNode(
				ship.components.shipMap.deckNodes,
				container.components.position,
			);
			if (!closestNode) throw new Error("No container available.");

			const nodePath = calculateShipMapPath(graph, closestNode.id, input.roomId);

			if (nodePath) {
				container.updateComponent("passengerMovement", {
					nodePath,
					nextNodeIndex: 0,
					destinationNode: input.roomId,
				});
			} else {
				throw new Error("No path to room.");
			}

			if (container.components.position.parentId) {
				pubsub.publish.cargoControl.containers({
					shipId: container.components.position.parentId,
				});
			}
			return { shipId: ship.id, containerId: container.id, roomId: input.roomId };
		}),
	transfer: t.procedure
		.input(
			z.object({
				fromId: transferId,
				toId: transferId,
				transfers: z.object({ item: z.string(), count: z.number() }).array(),
			}),
		)
		.meta({ event: true })
		.output(
			z.object({
				toShipId: z.number(),
				fromShipId: z.number(),
				toId: z.number(),
				fromId: z.number(),
				transferNames: z.string().array(),
			}),
		)
		.send(({ ctx, input }) => {
			const fromContainer = getCargoContents(ctx.ecs, input.fromId);
			if (!fromContainer) throw new Error("No source container found.");
			const toContainer = getCargoContents(ctx.ecs, input.toId);
			if (!toContainer) throw new Error("No destination container found.");

			const result = transferInventory(ctx.ecs, fromContainer, toContainer, input.transfers);

			pubsub.publish.cargoControl.containers({
				shipId: input.fromId.shipId,
			});
			pubsub.publish.cargoControl.rooms({
				shipId: input.fromId.shipId,
			});
			if (input.fromId.shipId !== input.toId.shipId) {
				pubsub.publish.cargoControl.containers({
					shipId: input.toId.shipId,
				});
				pubsub.publish.cargoControl.rooms({
					shipId: input.toId.shipId,
				});
			}
			return {
				toShipId: input.toId.shipId,
				fromShipId: input.fromId.shipId,
				toId: input.toId.id,
				fromId: input.fromId.id,
				transferNames: Object.keys(result),
			};
		}),
	getRoomByFlag: t.procedure
		.meta({
			action: (ctx: DataContext) => {
				const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);
				const items = Object.keys(inventoryTemplates);
				return {
					item: {
						name: "Inventory Items",
						type: "select",
						values: items,
					},
					flags: {
						name: "Filter Room By Flags",
						type: "select",
						inputProps: { multiple: true },
						values: nodeFlags,
					},
					systems: {
						name: "Filter Room By Systems",
						type: "select",
						inputProps: { multiple: true },
						values: Object.keys(ShipSystemTypes),
					},
				};
			},
		})
		.input(
			z.object({
				shipId: z.number(),
				flags: z.union([nodeFlagsSchema, nodeFlagsSchema.array()]).optional(),
				systems: z.array(z.string()).optional(),
			}),
		)
		.output(deckRoomOutput)
		.send(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found.");

			const room = getRoomFromFlagsAndSystems(ship, input.flags, input.systems);
			if ("deckIndex" in room) {
				return {
					shipId: ship.id,
					deckName: room.deck || "Unknown",
					deckIndex: room.deckIndex,
					roomName: room.name || "Unknown",
					roomId: room.id,
				};
			}
			return { shipId: ship.id, deckName: "", deckIndex: -1, roomName: "", roomId: ship.id };
		}),
	setItemCountInRoom: t.procedure
		.meta({
			action: (ctx: DataContext) => {
				const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);
				const items = Object.keys(inventoryTemplates);
				return {
					item: {
						name: "Inventory Items",
						type: "select",
						values: items,
					},
					flags: {
						name: "Filter Room By Flags",
						type: "select",
						inputProps: { multiple: true },
						values: nodeFlags,
					},
					systems: {
						name: "Filter Room By Systems",
						type: "select",
						inputProps: { multiple: true },
						values: Object.keys(ShipSystemTypes),
					},
				};
			},
		})
		.input(
			z.object({
				shipId: z.number(),
				flags: z.union([nodeFlagsSchema, nodeFlagsSchema.array()]).optional(),
				systems: z.array(z.string()).optional(),
				item: z.string().optional(),
				count: z.number(),
			}),
		)
		.output(deckRoomOutput)
		.send(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found.");

			const room = getRoomFromFlagsAndSystems(ship, input.flags, input.systems);

			const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);
			const inventoryItem = input.item || randomFromList(Object.keys(inventoryTemplates));

			if (!inventoryTemplates[inventoryItem]) throw new Error("Inventory item not found.");

			if (!room.contents[inventoryItem])
				room.contents[inventoryItem] = { count: 0, temperature: 295.37 };

			room.contents[inventoryItem].count = input.count;

			pubsub.publish.cargoControl.rooms({
				shipId: ship.id,
			});

			if ("deckIndex" in room) {
				return {
					shipId: ship.id,
					deckName: room.deck || "Unknown",
					deckIndex: room.deckIndex,
					roomName: room.name || "Unknown",
					roomId: room.id,
				};
			}
			return { shipId: ship.id, deckName: "", deckIndex: -1, roomName: "", roomId: ship.id };
		}),

	addItemToRoom: t.procedure
		.meta({
			action: (ctx: DataContext) => {
				const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);
				const items = Object.keys(inventoryTemplates);
				return {
					item: {
						name: "Inventory Item",
						type: "select",
						values: items,
					},
					flags: {
						name: "Filter Room By Flags",
						type: "select",
						inputProps: { multiple: true },
						values: nodeFlags,
					},
					systems: {
						name: "Filter Room By Systems",
						type: "select",
						inputProps: { multiple: true },
						values: Object.keys(ShipSystemTypes),
					},
					avoidContainer: {
						name: "Avoid Container",
						type: "checkbox",
						helper: "Choose a room that doesn't already have a container in it.",
					},
				};
			},
		})
		.input(
			z.object({
				shipId: z.number(),
				flags: z.union([nodeFlagsSchema, nodeFlagsSchema.array()]).optional(),
				systems: z.array(z.string()).optional(),
				item: z.string().optional(),
				count: z.number(),
				avoidContainer: z.boolean(),
			}),
		)
		.output(deckRoomOutput)
		.send(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found.");

			const room = getRoomFromFlagsAndSystems(
				ship,
				input.flags,
				input.systems,
				input.avoidContainer,
			);

			const inventoryTemplates = getInventoryTemplates(ctx.flight?.ecs);
			const inventoryItem = input.item || randomFromList(Object.keys(inventoryTemplates));

			if (!inventoryTemplates[inventoryItem]) throw new Error("Inventory item not found.");

			if (!room.contents[inventoryItem])
				room.contents[inventoryItem] = { count: 0, temperature: 295.37 };

			room.contents[inventoryItem].count += input.count;

			pubsub.publish.cargoControl.rooms({
				shipId: ship.id,
			});
			if ("deckIndex" in room) {
				return {
					shipId: ship.id,
					deckName: room.deck || "Unknown",
					deckIndex: room.deckIndex,
					roomName: room.name || "Unknown",
					roomId: room.id,
				};
			}
			return { shipId: ship.id, deckName: "", deckIndex: -1, roomName: "", roomId: ship.id };
		}),
	removeItemFromRoom: t.procedure
		.meta({
			action: (ctx: DataContext) => {
				const inventoryTemplates = getPluginInventoryTemplates(ctx);
				return {
					item: {
						name: "Inventory Items",
						type: "select",
						values: inventoryTemplates,
					},
					flags: {
						name: "Filter Room By Flags",
						type: "select",
						inputProps: { multiple: true },
						values: nodeFlags,
					},
					systems: {
						name: "Filter Room By Systems",
						type: "select",
						inputProps: { multiple: true },
						values: Object.keys(ShipSystemTypes),
					},
				};
			},
		})
		.input(
			z.object({
				shipId: z.number(),
				flags: z.union([nodeFlagsSchema, nodeFlagsSchema.array()]).optional(),
				systems: z.array(z.string()).optional(),
				item: z.string(),
				count: z.number(),
			}),
		)
		.output(deckRoomOutput)
		.send(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found.");

			const room = getRoomFromFlagsAndSystems(ship, input.flags, input.systems);

			if (!room.contents[input.item]) throw new Error("Item not found in room.");

			room.contents[input.item].count -= input.count;
			if (room.contents[input.item].count <= 0) {
				delete room.contents[input.item];
			}

			pubsub.publish.cargoControl.rooms({
				shipId: ship.id,
			});
			if ("deckIndex" in room) {
				return {
					shipId: ship.id,
					deckName: room.deck || "Unknown",
					deckIndex: room.deckIndex,
					roomName: room.name || "Unknown",
					roomId: room.id,
				};
			}
			return { shipId: ship.id, deckName: "", deckIndex: -1, roomName: "", roomId: ship.id };
		}),
	emptyRoomInventory: t.procedure
		.meta({
			action: () => ({
				flags: {
					name: "Filter Room By Flags",
					type: "select",
					inputProps: { multiple: true },
					values: nodeFlags,
				},
				systems: {
					name: "Filter Room By Systems",
					type: "select",
					inputProps: { multiple: true },
					values: Object.keys(ShipSystemTypes),
				},
			}),
		})
		.input(
			z.object({
				shipId: z.number(),
				flags: z.union([nodeFlagsSchema, nodeFlagsSchema.array()]).optional(),
				systems: z.array(z.string()).optional(),
			}),
		)
		.output(deckRoomOutput)
		.send(({ ctx, input }) => {
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found.");

			const room = getRoomFromFlagsAndSystems(ship, input.flags, input.systems);

			room.contents = {};

			pubsub.publish.cargoControl.rooms({
				shipId: ship.id,
			});
			if ("deckIndex" in room) {
				return {
					shipId: ship.id,
					deckName: room.deck || "Unknown",
					deckIndex: room.deckIndex,
					roomName: room.name || "Unknown",
					roomId: room.id,
				};
			}
			return { shipId: ship.id, deckName: "", deckIndex: -1, roomName: "", roomId: ship.id };
		}),
});

export function calculateCargoUsed(
	contents: {
		[inventoryTemplateName: string]: { count: number };
	},
	inventory: {
		[inventoryTemplateName: string]: { volume: number };
	},
) {
	if (!contents) return 0;
	const value = Object.keys(contents).reduce((acc, key) => {
		const template = inventory[key];
		if (!template) {
			return acc;
		}
		return acc + contents[key].count * template.volume;
	}, 0);

	return Math.round(value * 1000) / 1000;
}

export function getCargoContents(
	ecs: ECS,
	{ type, id, shipId }: { type: "room" | "entity"; shipId: number; id: number },
) {
	if (type === "entity") {
		const entity = ecs.getEntityById(id);
		const container = entity?.components.cargoContainer;
		if (!container) return null;
		return { volume: container.volume, contents: container.contents };
	}
	if (type === "room") {
		const room = ecs.getEntityById(shipId)?.components.shipMap?.deckNodes.find((d) => d.id === id);
		if (!room) return null;
		return { volume: room.volume, contents: room.contents };
	}
	return null;
}

export function getCargoRooms(ship: Entity | null) {
	if (!ship) return [];

	const inventoryTemplates = getInventoryTemplates(ship.ecs);

	if (!cargoRoomsCache.get(ship)) {
		cargoRoomsCache.set(
			ship,
			ship.components.shipMap?.deckNodes.filter(
				(node) => node.isRoom && node.flags?.includes("cargo"),
			) || [],
		);
	}
	const rooms =
		cargoRoomsCache.get(ship)!.map((node) => {
			return {
				id: node.id,
				name: node.name,
				deckIndex: node.deckIndex,
				deck: ship?.components.shipMap?.decks[node.deckIndex].name,
				position: { x: node.x, y: node.y },
				volume: node.volume,
				contents: node.contents,
				used: calculateCargoUsed(node.contents, inventoryTemplates),
				flags: node.flags,
				systems: node.systems,
			};
		}) || [];

	return rooms;
}

export function getRoomsForInventory(ship: Entity | null, inventoryName: string) {
	if (!ship) return [];

	const cargoRooms = getCargoRooms(ship);
	return cargoRooms.filter(
		(r) => inventoryName in r.contents && r.contents[inventoryName].count > 0,
	);
}

export function getRoomByFlag(ship: Entity, flag: NodeFlag) {
	if (!ship.components.shipMap && ship.components.cargoContainer) {
		return [ship.components.cargoContainer];
	}

	const rooms = getCargoRooms(ship);

	return rooms.filter((room) => room.flags?.includes(flag));
}

export function getRoomBySystem(ship: Entity | null, system: string) {
	if (!ship?.components.shipMap && ship?.components.cargoContainer) {
		return [{ id: ship.id, ...ship.components.cargoContainer }];
	}

	const rooms = getCargoRooms(ship);

	return rooms.filter((room) => room.systems?.includes(system));
}

function getRoomFromFlagsAndSystems(
	ship: Entity,
	flags?: NodeFlag[] | NodeFlag,
	systems?: string[],
	avoidContainer?: boolean,
):
	| {
			volume: number;
			contents: Record<
				string,
				{
					count: number;
					temperature: number;
				}
			>;
	  }
	| ReturnType<typeof getCargoRooms>[number] {
	if (!ship.components.shipMap && ship.components.cargoContainer) {
		return ship.components.cargoContainer;
	}

	const containerRooms = avoidContainer
		? [...(ship.ecs.componentCache.get("isCargoContainer") || [])]
				.filter((c) => c.components.position?.parentId === ship.id)
				.flatMap((c) => c.components.passengerMovement?.destinationNode || [])
		: [];

	const rooms = getCargoRooms(ship).filter((room) => {
		if (avoidContainer && containerRooms.includes(room.id)) return false;
		if (flags) {
			for (const flag of Array.isArray(flags) ? flags : [flags]) {
				if (!room.flags?.includes(flag)) return false;
			}
		}
		if (systems) {
			for (const system of systems) {
				if (!room.systems?.includes(system)) return false;
			}
		}
		return true;
	});
	const room = randomFromList(rooms);

	if (!room) throw new Error("Room not found.");

	return room;
}

type Container = {
	volume: number;
	contents: Record<
		string,
		{
			count: number;
		}
	>;
};

export function transferInventory(
	ecs: ECS,
	fromContainer: Container,
	toContainer: Container,
	transfers: {
		item: string;
		count: number;
	}[],
) {
	const inventoryTemplates = getInventoryTemplates(ecs);

	const itemCounts: { [key: string]: number } = {};
	let destinationVolume = toContainer.volume || 0;
	// First loop to see if there are any errors
	transfers.forEach(({ item, count }) => {
		if (!fromContainer.contents[item] || fromContainer.contents[item].count < count) {
			itemCounts[item] = fromContainer.contents[item]?.count || 0;
		}
		const destinationUsedSpace = calculateCargoUsed(toContainer.contents || {}, inventoryTemplates);
		const movedVolume = calculateCargoUsed(
			{ [item]: { count: itemCounts[item] || count } },
			inventoryTemplates,
		);

		if (destinationUsedSpace + movedVolume > destinationVolume) {
			const volumeLeft = destinationVolume - destinationUsedSpace;
			const singleVolume = calculateCargoUsed({ [item]: { count: 1 } }, inventoryTemplates);
			const cargoItemsThatFitInVolumeLeft = Math.floor(volumeLeft / singleVolume);

			itemCounts[item] = Math.min(itemCounts[item] || count, cargoItemsThatFitInVolumeLeft);
			if (itemCounts[item] <= 0) throw new Error("Not enough space in destination.");
		}
		const actualMovedVolume = calculateCargoUsed(
			{ [item]: { count: itemCounts[item] || count } },
			inventoryTemplates,
		);
		destinationVolume -= actualMovedVolume;
	});

	const transferredCounts: Record<string, number> = {};
	// Then loop to do the actual transfer
	transfers.forEach(({ item, count }) => {
		const C2 = itemCounts[item] ?? count;
		if (C2 === 0) return;
		fromContainer.contents[item].count -= C2;
		if (!toContainer.contents[item]) toContainer.contents[item] = { count: 0 };

		transferredCounts[item] = C2;
	});

	return transferredCounts;
}

const listFormatter = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" });
const pluralRules = new Intl.PluralRules("en-US");
export function inventoryToString(ecs: ECS, inventory: Record<string, number>): string {
	const inventoryTemplates = getInventoryTemplates(ecs);
	return listFormatter.format(
		Object.entries(inventory).map(([key, count]) => {
			const item = inventoryTemplates[key];
			return `${pluralize(count, item.name, item.plural)}`;
		}),
	);
}

function pluralize(count: number, singular: string, plural: string = singular) {
	const grammaticalNumber = pluralRules.select(count);
	switch (grammaticalNumber) {
		case "one":
			return count + " " + singular;
		case "other":
			return count + " " + plural;
		default:
			throw new Error("Unknown: " + grammaticalNumber);
	}
}

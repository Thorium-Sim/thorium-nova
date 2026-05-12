import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { calculateCargoUsed } from "@thorium/cards/CargoControl/data.server";
import { damageControlInstruction } from "@thorium/ecs-components/damageControl";
import { shipMap } from "@thorium/ecs-components/list";
import { getInventoryTemplates } from "@thorium/utils/.server/getInventoryTemplates";
import type { Entity } from "@thorium/utils/ecs";
import { produce } from "immer";
import z from "zod";

export const exocomps = t.router({
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
			const rooms = getSystemRooms(ship);
			const decks = ship.components.shipMap?.decks || [];

			return {
				rooms,
				decks,
				shipLength: ship.components.size?.length || 100,
			};
		}),
	inventory: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number } | null, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			const inventory = getInventoryTemplates(ctx.ecs);
			if (!ship) throw new Error("No ship selected");
			const parts = new Map<string, { name: string; count: number; image?: string }>();
			for (const room of ship.components.shipMap?.deckNodes || []) {
				for (const item in room.contents) {
					const inventoryItem = inventory[item];
					if (inventoryItem.flags.repair?.type.includes("Exocomp")) {
						parts.set(item, {
							name: inventoryItem.name,
							image: inventoryItem.assets.image,
							count: (parts.get(item)?.count || 0) + 1,
						});
					}
				}
			}
			return [...parts.values()];
		}),
	exocomps: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number } | null, { input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(["isExocomps"], (entity) => ({
			shipId: entity.components.isShipSystem?.shipId || -1,
		}))
		.request(({ ctx, input }) => {
			const inventoryTemplates = getInventoryTemplates(ctx.ecs);

			let exocomps = [];
			for (const entity of ctx.ecs.componentCache.get("exocomp") || []) {
				if (entity.components.exocomp?.shipId === input.shipId) {
					exocomps.push({
						id: entity.id,
						position: entity.components.position!,
						instructions: entity.components.exocomp.instructions,
						instructionIndex: entity.components.exocomp.instructionIndex,
						logs: entity.components.exocomp.logs,
						volume: entity.components.cargoContainer?.volume || 0,
						destinationNode: entity.components.passengerMovement?.destinationNode || null,
						contents: entity.components.cargoContainer?.contents || {},
						used: calculateCargoUsed(
							entity.components.cargoContainer?.contents || {},
							inventoryTemplates,
						),
						maxCharge: entity.components.exocomp.maxCharge,
						currentCharge: entity.components.exocomp.currentCharge,
					});
				}
			}

			return exocomps;
		}),
	stream: t.procedure.input(z.object({ shipId: z.number() })).dataStream(({ ctx, input }) => {
		const set = new Set<Entity>();
		for (let entity of ctx.ecs.componentCache.get("exocomp") || []) {
			if (entity.components.exocomp?.shipId === input.shipId) set.add(entity);
		}
		return set;
	}),
	assign: t.procedure
		.input(z.object({ exocompId: z.number(), instructions: damageControlInstruction.array() }))
		.send(({ ctx, input }) => {
			const exocomp = ctx.ecs.getEntityById(input.exocompId);
			if (!exocomp) throw new Error("Exocomp not found");
			exocomp.updateComponent("exocomp", {
				instructions: input.instructions,
				instructionIndex: 0,
				logs: produce(exocomp.components.exocomp?.logs || [], (draft) => {
					draft.push({
						state: "normal",
						text: `Received new instructions.`,
						timestamp: Date.now(),
					});
				}),
			});
			pubsub.publish.exocomps.exocomps({ shipId: exocomp.components.exocomp?.shipId || -1 });
		}),
	cancel: t.procedure.input(z.object({ exocompId: z.number() })).send(({ ctx, input }) => {
		const exocomp = ctx.ecs.getEntityById(input.exocompId);
		if (!exocomp) throw new Error("Exocomp not found");
		exocomp.updateComponent("exocomp", {
			instructions: [],
			instructionIndex: -1,
			logs: produce(exocomp.components.exocomp?.logs || [], (draft) => {
				draft.push({
					state: "normal",
					text: `Orders cancelled by operator.`,
					timestamp: Date.now(),
				});
			}),
		});
		pubsub.publish.exocomps.exocomps({ shipId: exocomp.components.exocomp?.shipId || -1 });
	}),
	// There aren't really any properties on the exocomps system, so we'll leave this be for a minute.
	// get: t.procedure.input(z.object({shipId:z.number()}))
	// 		.filter((publish: { shipId: number } | null, { input }) => {
	// 	if (publish && publish.shipId !== input.shipId) return false;
	// 	return true;
	// })		.autoPublish(["isExocomp"], (entity) => entity.components.exocomp && { shipId: entity.components.isShipSystem?.shipId||-1 })
	// .request(({ctx, input}) => {
	// 	const exocomps = getShipSystem(ctx.ecs, {systemType:"exocomps", shipId:input.shipId})
	// 	const exocompData = exocomps?.components.isExocomp
	// 	if (!exocompData) return null;

	// 	return {id: exocomps.id, meh: exocompData.}
	// })
});

type ShipMapDeckNode = z.infer<typeof shipMap>["deckNodes"][number];
const systemRoomsCache = new Map<Entity, ShipMapDeckNode[]>();

function getSystemRooms(ship: Entity | null) {
	if (!ship) return [];

	if (!systemRoomsCache.get(ship)) {
		systemRoomsCache.set(
			ship,
			ship.components.shipMap?.deckNodes.filter(
				(node) => node.isRoom && node.systems && node.systems?.length > 0,
			) || [],
		);
	}
	const rooms =
		systemRoomsCache.get(ship)!.map((node) => {
			return {
				id: node.id,
				name: node.name,
				deck: ship?.components.shipMap?.decks[node.deckIndex].name,
				position: { x: node.x, y: node.y },
				flags: node.flags,
				systems: node.systems,
			};
		}) || [];

	return rooms;
}

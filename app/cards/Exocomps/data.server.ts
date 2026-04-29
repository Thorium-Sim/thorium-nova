import { t } from "@thorium/.server/init/t";
import { shipMap } from "@thorium/ecs-components/list";
import type { Entity } from "@thorium/utils/ecs";
import { z } from "zod";

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

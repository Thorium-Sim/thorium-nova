import type { Entity } from "./ecs";

type DeckNode = NonNullable<
	Entity["components"]["shipMap"]
>["deckNodes"][number];
const shipCache = new Map<number, Map<number, DeckNode>>();

function getShipCache(ship: Entity): Map<number, DeckNode> {
	if (!shipCache.has(ship.id)) {
		shipCache.set(ship.id, new Map());
	}
	return shipCache.get(ship.id)!;
}

export function getDeckNode(id?: number, ship?: Entity) {
	if (!id) return undefined;
	if (!ship) return undefined;
	const deckNodeCache = getShipCache(ship);
	if (!deckNodeCache.get(id)) {
		const deckNode = ship.components.shipMap?.deckNodes.find(
			(d) => d.id === id,
		);
		if (deckNode) {
			deckNodeCache.set(id, deckNode);
		}
	}
	return deckNodeCache.get(id);
}

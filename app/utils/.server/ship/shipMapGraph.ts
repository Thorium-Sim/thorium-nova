import { createShipMapGraph } from "@thorium/utils/.server/ship/shipMapPathfinder";
import type { Entity } from "@thorium/utils/ecs";

const shipMapGraphCache = new Map<number, ReturnType<typeof createShipMapGraph>>();

export function getGraph(entity: Entity) {
	if (!shipMapGraphCache.has(entity.id)) {
		if (!entity.components.shipMap) throw new Error("Invalid ship map.");
		shipMapGraphCache.set(
			entity.id,
			createShipMapGraph(
				entity.components.shipMap?.deckEdges || [],
				entity.components.shipMap.deckNodes,
			),
		);
	}
	return shipMapGraphCache.get(entity.id)!;
}

export function invalidateGraph(entity: Entity) {
	shipMapGraphCache.delete(entity.id);
	return getGraph(entity);
}

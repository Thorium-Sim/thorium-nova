import type { ECS } from "@thorium/utils/ecs";

export function applyCardHighlight(
	ecs: ECS,
	shipId: number,
	station?: string | null,
	cards?: string[],
	highlight = true,
) {
	const ship = ecs.getEntityById(shipId);
	const stationObject = ship?.components.stationComplement?.stations.find(
		(s) => s.name === station,
	);
	for (const card of stationObject?.cards || []) {
		if (cards?.includes(card.name) || cards?.includes(card.component)) {
			card.highlight = highlight;
		}
	}
}

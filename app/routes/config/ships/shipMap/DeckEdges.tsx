import type { DeckNode } from "@thorium/.server/classes/Plugins/Ship/Deck";
import { q } from "@thorium/context/AppContext";
import type { EdgeFlag } from "@thorium/utils/flags/DeckEdge";
import { useParams } from "react-router";

import { DeckEdge } from "./DeckEdge";

export function DeckEdges({
	deckNodes,
	deckNodeIds,
	sizeRatio,
}: {
	deckNodes: DeckNode[];
	deckNodeIds: number[];
	sizeRatio: number;
}) {
	const { pluginId, shipId } = useParams() as {
		pluginId: string;
		shipId: string;
		deckName: string;
	};
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });

	return (
		<svg className="pointer-events-none absolute inset-0 h-full w-full">
			<title>edges</title>
			{data.deckEdges
				.filter((edge) => deckNodeIds.includes(edge.from) && deckNodeIds.includes(edge.to))
				.map((edge) => (
					<DeckEdge
						key={edge.id}
						sizeRatio={sizeRatio}
						{...edge}
						allNodes={deckNodes}
						updateEdge={(input: { weight: number } | { flags: EdgeFlag[] }) => {
							q.plugin.ship.deck.updateEdge.netSend({
								pluginId,
								shipId,
								edgeId: edge.id,
								...input,
							});
						}}
						removeEdge={() => {
							q.plugin.ship.deck.removeEdge.netSend({
								pluginId,
								shipId,
								edgeId: edge.id,
							});
						}}
					/>
				))}
		</svg>
	);
}

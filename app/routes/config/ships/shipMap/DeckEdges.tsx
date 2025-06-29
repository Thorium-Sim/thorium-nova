import { q } from "@thorium/context/AppContext";
import { useParams } from "react-router";

import { DeckEdge } from "./DeckEdge";
import type { EdgeFlag } from "@thorium/utils/flags/DeckEdge";
import type { DeckNode } from "@thorium/.server/classes/Plugins/Ship/Deck";

export function DeckEdges({
	deckNodes,
	deckNodeIds,
}: {
	deckNodes: DeckNode[];
	deckNodeIds: number[];
}) {
	const { pluginId, shipId, deckName } = useParams() as {
		pluginId: string;
		shipId: string;
		deckName: string;
	};
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });

	return (
		<svg className="pointer-events-none absolute inset-0 w-full h-full">
			<title>edges</title>
			{data.deckEdges
				.filter(
					(edge) =>
						deckNodeIds.includes(edge.from) && deckNodeIds.includes(edge.to),
				)
				.map((edge) => (
					<DeckEdge
						key={edge.id}
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

import { q } from "@thorium/context/AppContext";
import type { updateNodeParams } from "@thorium/routes/config/ships/shipMap/deckConfig";
import { NodeConfig } from "@thorium/routes/config/ships/shipMap/NodeCircle";
import { href, useNavigate } from "react-router";

import type { Route } from "./+types/roomConfig";
export default function RoomConfig({
	params: { pluginId, deckName, roomId, shipId },
}: Route.ComponentProps) {
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });
	const deck = data.decks.find((d) => d.name === deckName);
	const navigate = useNavigate();
	if (!deck) {
		throw new Error("Deck not found");
	}
	const nodes = deck.nodes;
	const room = nodes.find((n) => n.id === Number(roomId));
	if (!room) throw new Error("Room not found");

	return (
		<div className="flex h-full min-h-0 flex-auto flex-col overflow-y-auto">
			<NodeConfig
				key={`${deckName}-${roomId}`}
				node={room}
				updateNode={async (params: updateNodeParams) => {
					await q.plugin.ship.deck.updateNode.netSend({
						pluginId,
						shipId,
						deckId: deckName,
						nodeId: Number(roomId),
						...params,
					});
				}}
				removeNode={() => {
					q.plugin.ship.deck.removeNode.netSend({
						pluginId,
						shipId,
						deckId: deckName,
						nodeId: Number(roomId),
					});
					navigate(href("/config/:pluginId/ships/:shipId/shipMap/rooms", { pluginId, shipId }));
				}}
			/>
		</div>
	);
}

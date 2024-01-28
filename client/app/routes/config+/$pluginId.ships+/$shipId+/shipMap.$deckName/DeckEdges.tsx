import {q} from "@client/context/AppContext";
import {useParams} from "@remix-run/react";
import type {DeckNode, EdgeFlag} from "@server/classes/Plugins/Ship/Deck";
import {DeckEdge} from "./DeckEdge";

export function DeckEdges({
  deckNodes,
  deckNodeIds,
}: {
  deckNodes: DeckNode[];
  deckNodeIds: number[];
}) {
  const {pluginId, shipId, deckName} = useParams() as {
    pluginId: string;
    shipId: string;
    deckName: string;
  };
  const [data] = q.plugin.ship.get.useNetRequest({pluginId, shipId});

  return (
    <svg className="pointer-events-none absolute inset-0 w-full h-full">
      {data.deckEdges
        .filter(
          edge =>
            deckNodeIds.includes(edge.from) && deckNodeIds.includes(edge.to)
        )
        .map(edge => (
          <DeckEdge
            key={edge.id}
            {...edge}
            allNodes={deckNodes}
            updateEdge={(input: {weight: number} | {flags: EdgeFlag[]}) => {
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

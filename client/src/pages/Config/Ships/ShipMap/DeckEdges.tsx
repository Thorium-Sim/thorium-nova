import {useNetRequest} from "client/src/context/useNetRequest";
import {useParams} from "react-router-dom";
import {netSend} from "client/src/context/netSend";
import {DeckNode, EdgeFlag} from "server/src/classes/Plugins/Ship/Deck";
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
  const data = useNetRequest("pluginShip", {pluginId, shipId});

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
              netSend("pluginShipDeckUpdateEdge", {
                pluginId,
                shipId,
                edgeId: edge.id,
                ...input,
              });
            }}
            removeEdge={() => {
              netSend("pluginShipDeckRemoveEdge", {
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

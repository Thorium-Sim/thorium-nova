import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {useParams} from "react-router-dom";
import PanZoom from "@client/components/ui/PanZoom";
import useMeasure from "@client/hooks/useMeasure";
import {useEffect, useRef, useState} from "react";
import Button from "@thorium/ui/Button";
import UploadWell from "@thorium/ui/UploadWell";
import {useConfirm} from "@thorium/ui/AlertDialog";
import type {
  DeckEdge as DeckEdgeT,
  DeckNode,
  NodeFlag,
} from "@server/classes/Plugins/Ship/Deck";
import {useDeckNode} from "./DeckNodeContext";
import {NodeCircle} from "./NodeCircle";
import {EdgeContextProvider} from "./EdgeContextProvider";
import {DeckEdges} from "./DeckEdges";
import {q} from "@client/context/AppContext";

export interface PanStateI {
  x: number;
  y: number;
  scale: number;
}
export type updateNodeParams =
  | {x: number; y: number}
  | {isRoom: boolean}
  | {name: string}
  | {radius: number}
  | {volume: number}
  | {flags: NodeFlag[]};
const pixelRatio = window.devicePixelRatio;

export function DeckConfig() {
  const {pluginId, shipId, deckName} = useParams() as {
    pluginId: string;
    shipId: string;
    deckName: string;
  };
  const [data] = q.plugin.ship.get.useNetRequest({pluginId, shipId});
  const deck = data.decks.find(d => d.name === deckName);
  if (!deck) {
    throw new Error("Deck not found");
  }
  const {
    nodeState,
    edgeState: [, setSelectedEdgeId],
  } = useDeckNode();
  const [selectedNodeId, setSelectedNodeId] = nodeState;
  const nodes = deck.nodes;
  const deckImage = deck.backgroundUrl;

  const [ref, , , node] = useMeasure<HTMLDivElement>();
  const panState = useRef<PanStateI>({x: 0, y: 0, scale: 1});
  // Used to determine if a click event is after a pan event

  const panned = useRef(false);

  const confirm = useConfirm();

  const elementNameRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (node) {
      function handleMouseOver(e: MouseEvent) {
        if (elementNameRef.current) {
          elementNameRef.current.textContent =
            (e.target as any)?.getAttribute("name") || "";
        }
      }
      node.addEventListener("mouseover", handleMouseOver);
      return () => {
        node.removeEventListener("mouseover", handleMouseOver);
      };
    }
  }, [node]);

  const [addingNodes, setAddingNodes] = useState(false);
  const [addingEdges, setAddingEdges] = useState(false);

  const deckNodes = data.decks.reduce((acc: DeckNode[], deck) => {
    if (deckName !== deck.name) return acc;
    return [...acc, ...deck.nodes];
  }, []);
  const deckNodeIds = deckNodes.map(node => node.id);

  if (!deckImage) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <UploadWell
          accept="image/*"
          onChange={async files => {
            await q.plugin.ship.deck.update.netSend({
              pluginId,
              shipId,
              deckId: deck.name,
              backgroundImage: files[0],
            });
          }}
        />
        <small>Upload a background image for the deck</small>
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col gap-4 h-full " ref={ref}>
      <PanZoom
        // TODO March 3, 2022 - Set the initial pan and zoom state so the item is centered
        key={`${deck.name}-${deckName}-${deckImage}`}
        onMouseDown={() => {
          panned.current = false;
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        style={{width: "100%", outline: "none", flex: 1}}
        className="text-purple-400 border-2 border-white/10 rounded-lg bg-gray-800 overflow-hidden"
        maxZoom={8}
        minZoom={0.5}
        noStateUpdate={false}
        onPan={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        onStateChange={(state: PanStateI) => {
          panned.current = true;
          panState.current = state;
        }}
        disableDoubleClickZoom
      >
        <SVGImageLoader
          style={{
            width: `${data.length * pixelRatio}px`,
          }}
          url={deckImage}
          onClick={async e => {
            if (panned.current || !addingNodes) return;
            e.stopPropagation();
            const {left, top} = e.currentTarget.getBoundingClientRect();

            const x = (e.clientX - left) / panState.current.scale / pixelRatio;
            const y = (e.clientY - top) / panState.current.scale / pixelRatio;
            const node = await q.plugin.ship.deck.addNode.netSend({
              pluginId,
              shipId,
              deckId: deck.name,
              x,
              y,
            });
            setSelectedNodeId(node.id);
          }}
        />
        <EdgeContextProvider>
          <DeckEdges deckNodes={deckNodes} deckNodeIds={deckNodeIds} />

          {nodes.map(deckNode => (
            <NodeCircle
              key={deckNode.id}
              {...deckNode}
              panState={panState}
              updateNode={async (params: updateNodeParams) => {
                await q.plugin.ship.deck.updateNode.netSend({
                  pluginId,
                  shipId,
                  deckId: deck.name,
                  nodeId: deckNode.id,
                  ...params,
                });
              }}
              selectNode={() => {
                if (selectedNodeId && addingEdges) {
                  if (selectedNodeId === deckNode.id) {
                    setSelectedNodeId(null);
                    setSelectedEdgeId(null);
                  } else {
                    setSelectedNodeId(null);
                    q.plugin.ship.deck.addEdge.netSend({
                      pluginId,
                      shipId,
                      from: selectedNodeId,
                      to: deckNode.id,
                    });
                  }
                } else {
                  setSelectedNodeId(deckNode.id);
                  setSelectedEdgeId(null);
                }
              }}
              deselectNode={() => {
                setSelectedNodeId(null);
                setSelectedEdgeId(null);
              }}
              removeNode={() => {
                q.plugin.ship.deck.removeNode.netSend({
                  pluginId,
                  shipId,
                  deckId: deck.name,
                  nodeId: deckNode.id,
                });
                setSelectedNodeId(null);
              }}
              selected={selectedNodeId === deckNode.id}
              addingEdges={addingEdges}
              hasCrossDeckConnection={getCrossDeckConnection(
                deckNode.id,
                data.deckEdges,
                deckNodeIds
              )}
            />
          ))}
        </EdgeContextProvider>
      </PanZoom>
      <div>
        <div className="flex gap-4">
          <Button
            className="btn-error"
            onClick={async () => {
              if (
                await confirm({
                  header: "Are you sure you want to remove this deck image?",
                })
              ) {
                await q.plugin.ship.deck.update.netSend({
                  pluginId,
                  shipId,
                  deckId: deck.name,
                  backgroundImage: null,
                });
              }
            }}
          >
            Remove Background
          </Button>
          <Button
            className={addingNodes ? "btn-warning" : "btn-primary"}
            onClick={() => {
              setAddingEdges(false);
              setAddingNodes(!addingNodes);
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
          >
            {addingNodes ? "Done Adding Nodes" : "Add Nodes"}
          </Button>
          <Button
            className={addingEdges ? "btn-warning" : "btn-info"}
            onClick={() => {
              setAddingNodes(false);
              setAddingEdges(!addingEdges);
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
          >
            {addingEdges ? "Done Adding Edges" : "Add Edges"}
          </Button>
          {addingNodes && <p>Click on map to add node</p>}
          {addingEdges &&
            (selectedNodeId ? (
              <p>Choose a node to connect to.</p>
            ) : (
              <p>Click on the starting node</p>
            ))}
        </div>
        <p ref={elementNameRef} className="h-4">
          &nbsp;
        </p>
      </div>
    </div>
  );
}

function getCrossDeckConnection(
  nodeId: number,
  edges: DeckEdgeT[],
  deckNodeIds: number[]
) {
  const roomEdges = edges.filter(
    edge => edge.from === nodeId || edge.to === nodeId
  );
  if (
    roomEdges.some(edge => {
      const otherNode = edge.from === nodeId ? edge.to : edge.from;
      return !deckNodeIds.includes(otherNode);
    })
  ) {
    return true;
  }
  return false;
}

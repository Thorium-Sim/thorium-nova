import {SVGImageLoader} from "@thorium/ui/SVGImageLoader";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useParams} from "react-router-dom";
import PanZoom from "client/src/components/ui/PanZoom";
import useMeasure from "client/src/hooks/useMeasure";
import {MutableRefObject, useEffect, useMemo, useRef, useState} from "react";
import Button from "@thorium/ui/Button";
import UploadWell from "@thorium/ui/UploadWell";
import {netSend} from "client/src/context/netSend";
import {useConfirm} from "@thorium/ui/AlertDialog";
import type {DeckNode, NodeFlag} from "server/src/classes/Plugins/Ship/Deck";
import {useDrag} from "@use-gesture/react";
import {autoUpdate, offset, shift, useFloating} from "@floating-ui/react-dom";
import Input from "@thorium/ui/Input";
import Checkbox from "@thorium/ui/Checkbox";
import {Portal} from "@headlessui/react";
import useOnClickOutside from "client/src/hooks/useClickOutside";

export interface PanStateI {
  x: number;
  y: number;
  scale: number;
}
type updateNodeParams =
  | {x: number; y: number}
  | {isRoom: boolean}
  | {name: string}
  | {radius: number}
  | {flags: NodeFlag[]};
const pixelRatio = window.devicePixelRatio;

const NodePopover = ({}) => {};
function NodeCircle({
  id,
  x,
  y,
  isRoom,
  radius,
  name,
  icon,
  selected,
  panState,
  updateNode,
  selectNode,
  deselectNode,
  removeNode,
}: DeckNode & {
  panState: MutableRefObject<PanStateI>;
  updateNode: (params: updateNodeParams) => void;
  selectNode: () => void;
  deselectNode: () => void;
  removeNode: () => void;
  selected: boolean;
}) {
  const {
    x: floatingX,
    y: floatingY,
    reference,
    floating,
    strategy,
    update,
    refs,
  } = useFloating({
    placement: "bottom",
    middleware: [shift(), offset({mainAxis: 10})],
  });
  const [radiusValue, setRadiusValue] = useState(radius);
  useEffect(() => {
    setRadiusValue(radius);
  }, [radius]);

  const bind = useDrag(({down, movement: [mx, my]}) => {
    if (down) {
      selectNode();
    }
    if (!(refs.reference.current instanceof HTMLDivElement)) return;
    refs.reference.current.style.transform = `translate(${
      x * pixelRatio + mx / panState.current.scale
    }px, ${y * pixelRatio + my / panState.current.scale}px)`;
    if (refs.floating.current) {
      autoUpdate(refs.reference.current, refs.floating.current, update);
    }
    if (!down) {
      updateNode({
        x: (x * pixelRatio + mx / panState.current.scale) / pixelRatio,
        y: (y * pixelRatio + my / panState.current.scale) / pixelRatio,
      });
    }
  });
  useOnClickOutside(refs.floating, () => {
    if (selected) {
      deselectNode();
    }
  });
  const confirm = useConfirm();
  return (
    <>
      <div
        ref={reference}
        className={`rounded-full bg-white w-2 h-2 absolute -top-1 -left-1 cursor-grab touch-none`}
        onMouseDown={e => e.stopPropagation()}
        {...bind()}
        style={{
          transform: `translate(${x * pixelRatio}px, ${y * pixelRatio}px)`,
        }}
      >
        <div
          className="absolute rounded-full bg-white/10 pointer-events-none"
          style={{
            width: `${radiusValue * 2 * pixelRatio}px`,
            height: `${radiusValue * 2 * pixelRatio}px`,
            top: `calc(-${radiusValue * pixelRatio}px + 0.25rem)`,
            left: `calc(-${radiusValue * pixelRatio}px + 0.25rem)`,
          }}
        ></div>
      </div>
      <Portal>
        {selected && (
          <div
            ref={floating}
            className="rounded min-w-max w-44 p-2 bg-black/60 backdrop-blur shadow-lg z-10 text-white space-y-4"
            style={{
              position: strategy,
              top: floatingY ?? "",
              left: floatingX ?? "",
            }}
          >
            <Input
              label="Name"
              labelHidden
              autoFocus
              placeholder="Name"
              defaultValue={name}
              onMouseDown={e => e.stopPropagation()}
              onChange={e => {
                updateNode({name: e.target.value});
              }}
            />
            <Checkbox
              label="Is Room"
              defaultChecked={isRoom}
              onChange={e => updateNode({isRoom: e.target.checked})}
            />
            <Input
              label="Radius"
              type="range"
              min={0}
              max={100}
              defaultValue={radius}
              onMouseDown={e => e.stopPropagation()}
              onChange={e => setRadiusValue(e.target.valueAsNumber)}
              onMouseUp={e =>
                updateNode({
                  radius: Number(
                    (e.target as EventTarget & HTMLInputElement).value
                  ),
                })
              }
            />
            <Button
              className="btn-error btn-sm w-full"
              onClick={async () => {
                if (
                  await confirm({
                    header: "Delete Node",
                    body: "Are you sure you want to delete this node?",
                  })
                ) {
                  removeNode();
                }
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </Portal>
    </>
  );
}

export function DeckConfig() {
  const {pluginId, shipId, deckName} = useParams() as {
    pluginId: string;
    shipId: string;
    deckName: string;
  };
  const data = useNetRequest("pluginShip", {pluginId, shipId});
  const deck = data.decks.find(d => d.name === deckName);
  if (!deck) {
    throw new Error("Deck not found");
  }
  const nodes = deck.nodes;
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const deckImage = deck.backgroundUrl;

  const [ref, dimensions, , node] = useMeasure<HTMLDivElement>();
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

  if (!deckImage) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <UploadWell
          accept="image/*"
          onChange={async files => {
            await netSend("pluginShipDeckUpdate", {
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
        onMouseDown={() => (panned.current = false)}
        style={{width: "100%", outline: "none", flex: 1}}
        className="text-purple-400 border-2 border-white/10 rounded-lg bg-gray-800 overflow-hidden"
        maxZoom={8}
        minZoom={0.5}
        noStateUpdate={false}
        onStateChange={(state: PanStateI) => {
          panned.current = true;
          panState.current = state;
          setSelectedNodeId(null);
        }}
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
            const node = await netSend("pluginShipDeckAddNode", {
              pluginId,
              shipId,
              deckId: deck.name,
              x,
              y,
            });
            setSelectedNodeId(node.id);
          }}
        />
        {nodes.map(node => (
          <NodeCircle
            key={node.id}
            {...node}
            panState={panState}
            updateNode={async (params: updateNodeParams) => {
              await netSend("pluginShipDeckUpdateNode", {
                pluginId,
                shipId,
                deckId: deck.name,
                nodeId: node.id,
                ...params,
              });
            }}
            selectNode={() => setSelectedNodeId(node.id)}
            deselectNode={() => setSelectedNodeId(null)}
            removeNode={() => {
              netSend("pluginShipDeckRemoveNode", {
                pluginId,
                shipId,
                deckId: deck.name,
                nodeId: node.id,
              });
              setSelectedNodeId(null);
            }}
            selected={selectedNodeId === node.id}
          />
        ))}
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
                await netSend("pluginShipDeckUpdate", {
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
            onClick={() => setAddingNodes(!addingNodes)}
          >
            {addingNodes ? "Done" : "Add Nodes"}
          </Button>
          {addingNodes && <p>Click on map to add node</p>}
        </div>
        <p ref={elementNameRef} className="h-4">
          &nbsp;
        </p>
      </div>
    </div>
  );
}

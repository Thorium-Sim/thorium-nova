import Button from "@thorium/ui/Button";
import {useConfirm} from "@thorium/ui/AlertDialog";
import {DeckNode, EdgeFlag} from "server/src/classes/Plugins/Ship/Deck";
import {offset, shift, useFloating} from "@floating-ui/react-dom";
import {Portal} from "@headlessui/react";
import {useDeckNode} from "./DeckNodeContext";
import {useEdgeRerender} from "./EdgeContextProvider";
const pixelRatio = window.devicePixelRatio;
export function DeckEdge({
  id,
  from,
  to,
  allNodes,
  removeEdge,
  updateEdge,
}: {
  id: number;
  from: number;
  to: number;
  allNodes: DeckNode[];
  removeEdge: () => void;
  updateEdge: (input: {weight: number} | {flags: EdgeFlag[]}) => void;
}) {
  const fromNode = allNodes.find(node => node.id === from);
  const toNode = allNodes.find(node => node.id === to);

  const {
    edgeState: [selectedEdge, setSelectedEdge],
  } = useDeckNode();

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

  useEdgeRerender(from, to, (nodeId, x, y) => {
    if (!fromNode || !toNode) return;
    const {x: fromX, y: fromY} = fromNode;
    const {x: toX, y: toY} = toNode;
    if (refs.reference.current instanceof SVGPathElement) {
      const ref = refs.reference.current;
      if (nodeId === from) {
        ref.setAttribute(
          "d",
          `M ${x} ${y} L ${toX * pixelRatio} ${toY * pixelRatio}`
        );
      } else if (nodeId === to) {
        ref.setAttribute(
          "d",
          `M ${fromX * pixelRatio} ${fromY * pixelRatio} L ${x} ${y}`
        );
      }
    }
  });
  const confirm = useConfirm();
  if (!fromNode || !toNode) return null;
  const {x: fromX, y: fromY} = fromNode;
  const {x: toX, y: toY} = toNode;
  return (
    <>
      <path
        ref={reference}
        d={`M ${fromX * pixelRatio} ${fromY * pixelRatio} L ${
          toX * pixelRatio
        } ${toY * pixelRatio}`}
        stroke="white"
        className={`pointer-events-auto ${
          selectedEdge === id ? "stroke-yellow-500" : "hover:stroke-primary"
        }`}
        onClick={() => setSelectedEdge(id)}
        strokeWidth={2}
      />
      <Portal>
        {selectedEdge === id && (
          <div
            ref={floating}
            className="rounded min-w-max w-44 p-2 bg-black/60 backdrop-blur shadow-lg z-10 text-white space-y-4"
            style={{
              position: strategy,
              top: floatingY ?? "",
              left: floatingX ?? "",
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <Button
              className="btn-error btn-sm w-full"
              onClick={async () => {
                if (
                  await confirm({
                    header: "Delete Node",
                    body: "Are you sure you want to delete this node?",
                  })
                ) {
                  setSelectedEdge(null);
                  removeEdge();
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

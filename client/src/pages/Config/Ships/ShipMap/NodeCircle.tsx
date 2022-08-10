import {MutableRefObject, useEffect, useState} from "react";
import Button from "@thorium/ui/Button";
import {useConfirm} from "@thorium/ui/AlertDialog";
import {DeckNode, nodeFlags} from "server/src/classes/Plugins/Ship/Deck";
import {useDrag} from "@use-gesture/react";
import {autoUpdate, offset, shift, useFloating} from "@floating-ui/react-dom";
import Input from "@thorium/ui/Input";
import Checkbox from "@thorium/ui/Checkbox";
import {Portal} from "@headlessui/react";
import useOnClickOutside from "client/src/hooks/useClickOutside";
import {PanStateI, updateNodeParams} from "./DeckConfig";
import {useTriggerEdgeRender} from "./EdgeContextProvider";
import {capitalCase} from "change-case";
import InfoTip from "@thorium/ui/InfoTip";
const pixelRatio = window.devicePixelRatio;
export function NodeCircle({
  id,
  x,
  y,
  isRoom,
  radius,
  volume,
  flags,
  name,
  icon,
  selected,
  panState,
  updateNode,
  selectNode,
  deselectNode,
  removeNode,
  addingEdges,
  hasCrossDeckConnection,
}: DeckNode & {
  panState: MutableRefObject<PanStateI>;
  updateNode: (params: updateNodeParams) => void;
  selectNode: () => void;
  deselectNode: () => void;
  removeNode: () => void;
  selected: boolean;
  addingEdges: boolean;
  hasCrossDeckConnection: boolean;
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

  const renderEdges = useTriggerEdgeRender(id);
  const bind = useDrag(({down, movement: [mx, my]}) => {
    if (down) {
      selectNode();
    }
    if (!(refs.reference.current instanceof HTMLDivElement)) return;
    const newX = x * pixelRatio + mx / panState.current.scale;
    const newY = y * pixelRatio + my / panState.current.scale;
    refs.reference.current.style.transform = `translate(${newX}px, ${newY}px)`;
    if (refs.floating.current) {
      autoUpdate(refs.reference.current, refs.floating.current, update);
    }
    renderEdges(newX, newY);
    if (!down) {
      updateNode({
        x: newX / pixelRatio,
        y: newY / pixelRatio,
      });
    }
  });
  useOnClickOutside(refs.floating, () => {
    if (selected && !addingEdges) {
      deselectNode();
    }
  });
  const confirm = useConfirm();
  return (
    <>
      <div
        ref={reference}
        className={`rounded-full ${
          selected ? (addingEdges ? "bg-purple-400" : "bg-primary") : "bg-white"
        } w-2 h-2 absolute -top-1 -left-1 cursor-grab touch-none ${
          hasCrossDeckConnection ? "ring-1" : ""
        } ring-white ring-offset-1 ring-offset-black`}
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
        {selected && !addingEdges && (
          <div
            ref={floating}
            className="rounded min-w-max w-52 max-h-96 overflow-y-auto p-2 bg-black/60 backdrop-blur shadow-lg z-10 text-white space-y-4"
            style={{
              position: strategy,
              top: floatingY ?? "",
              left: floatingX ?? "",
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <Input
              className="sticky top-0"
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
            {nodeFlags.map(flag => (
              <Checkbox
                key={flag}
                label={
                  <>
                    {capitalCase(flag)}
                    <FlagExplainer flag={flag} />
                  </>
                }
                defaultChecked={flags.includes(flag)}
                onChange={e => {
                  if (e.target.checked) {
                    updateNode({flags: [...flags, flag]});
                  } else {
                    updateNode({flags: flags.filter(f => f !== flag)});
                  }
                }}
              />
            ))}
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
            {isRoom && flags.includes("cargo") && (
              <Input
                label="Volume for cargo in cubic meters"
                pattern="[0-9]*"
                defaultValue={volume}
                onChange={e => updateNode({volume: Number(e.target.value)})}
              />
            )}
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

function FlagExplainer({flag}: {flag: string}) {
  if (flag === "cargo") {
    return <InfoTip>Whether the room accepts cargo.</InfoTip>;
  }
  return null;
}

import {CardProps} from "@client/components/Station/CardProps";
import {q} from "@client/context/AppContext";
import {PointerEventHandler, useMemo, useRef, useState} from "react";
import {Connector, ConnectorHandle} from "./Connector";
import {PowerNode} from "./PowerNode";
import {Reactor} from "./Reactor";
import {Battery} from "./Battery";
import {SketchyConnector} from "./SketchyConnector";
import clsx from "clsx";
import {Portal} from "@headlessui/react";

function ConnectionPoint({
  handleDrag,
  side,
  id,
  outId,
}: {
  side: "out" | "in";
  id: number;
  outId?: number;
  handleDrag: PointerEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      className="p-1 cursor-grab "
      onPointerDown={handleDrag}
      data-side={side}
      data-id={id}
      data-outid={outId}
    >
      <div className="w-3 h-3 rounded-full bg-gray-900 border-2 border-white shadow-white shadow-sm pointer-events-none"></div>
    </div>
  );
}

export function PowerGrid({cardLoaded}: CardProps) {
  // Refetch every second, that's all that we really need.
  const [reactors] = q.powerGrid.reactors.get.useNetRequest(undefined, {
    // refetchInterval: 1000,
  });
  const [batteries] = q.powerGrid.batteries.get.useNetRequest();
  const [powerNodes] = q.powerGrid.powerNodes.get.useNetRequest();

  q.powerGrid.stream.useDataStream();

  const draggingRef = useRef<ConnectorHandle>(null);

  const {powerToBatteries, powerToNodes} = useMemo(() => {
    const powerToBatteries: Record<number, number[]> = {};
    const powerToNodes: Record<number, number[]> = {};

    reactors.forEach(reactor => {
      reactor.connectedTo.forEach(id => {
        if (batteries.some(b => b.id === id)) {
          if (!powerToBatteries[id]) powerToBatteries[id] = [];
          powerToBatteries[id].push(reactor.id);
        }
        if (powerNodes.some(b => b.id === id)) {
          if (!powerToNodes[id]) powerToNodes[id] = [];
          powerToNodes[id].push(reactor.id);
        }
      });
    });
    batteries.forEach(battery => {
      battery.connectedTo.forEach(id => {
        if (powerNodes.some(b => b.id === id)) {
          if (!powerToNodes[id]) powerToNodes[id] = [];
          powerToNodes[id].push(battery.id);
        }
      });
    });
    return {powerToBatteries, powerToNodes};
  }, [batteries, powerNodes, reactors]);

  const handleDrag: PointerEventHandler<HTMLDivElement> = event => {
    document.body.classList.add("drag-active");
    document.addEventListener("pointerup", handleDragStop);
    document.addEventListener("pointermove", handleDragging);

    const rect = event.currentTarget.getBoundingClientRect();
    let side = event.currentTarget.dataset.side;
    let id = Number(event.currentTarget.dataset.id);
    const outId = Number(event.currentTarget.dataset.outid);
    const existingConnection =
      side === "in" &&
      (powerToBatteries[id]?.includes(outId) ||
        powerToNodes[id]?.includes(outId));

    let point1 = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
    };

    let point2 = {
      x: event.clientX,
      y: event.clientY,
    };

    if (existingConnection) {
      const outDims = document
        .querySelector(`[data-id="${outId}"]`)
        ?.getBoundingClientRect();
      if (outDims) {
        point1 = {
          x: outDims.x + outDims.width / 2,
          y: outDims.y + outDims.height / 2,
        };
      }
      side = "out";
      q.powerGrid.disconnectNodes.netSend({in: id, out: outId});
    }

    draggingRef.current?.update({
      from: side === "out" ? point1 : point2,
      to: side === "out" ? point2 : point1,
      visible: true,
    });

    function handleDragging(event: PointerEvent) {
      const point2 = {
        x: event.clientX,
        y: event.clientY,
      };
      draggingRef.current?.update({
        from: side === "out" ? point1 : point2,
        to: side === "out" ? point2 : point1,
        visible: true,
      });
    }

    function handleDragStop(stopEvent: PointerEvent) {
      document.removeEventListener("pointerup", handleDragStop);
      document.removeEventListener("pointermove", handleDragging);
      draggingRef.current?.hide();
      document.body.classList.remove("drag-active");

      if (
        stopEvent.target instanceof HTMLDivElement &&
        stopEvent.target.dataset.id &&
        event.target instanceof HTMLDivElement
      ) {
        let connectSide = stopEvent.target.dataset.side;
        let connectId = Number(stopEvent.target.dataset.id);
        if (existingConnection) {
          id = outId;
        }
        if (!connectSide || !side || isNaN(connectId + id)) return;
        const connection = {
          [connectSide]: connectId,
          [side]: id,
        } as {in: number; out: number};
        q.powerGrid.connectNodes.netSend(connection);
      }
    }
  };

  const [draggingSystem, setDraggingSystem] = useState<{
    id: number;
    name?: string;
  } | null>(null);
  const draggingSystemRef = useRef<HTMLDivElement>(null);

  const cardArea = document
    .querySelector(".card-area")
    ?.getBoundingClientRect();

  function setDragging(system: {id: number; name?: string}, rect: DOMRect) {
    setDraggingSystem(system);
    let x = rect.left - 9;
    let y = rect.top - 9;
    if (draggingSystemRef.current) {
      draggingSystemRef.current.style.left = `${x}px`;
      draggingSystemRef.current.style.top = `${y}px`;
    }
    const powerNodes = Array.from(document.querySelectorAll("[data-nodeid]"));

    function handleDrag(event: globalThis.PointerEvent) {
      document.body.classList.add("drag-active");

      x += event.movementX;
      y += event.movementY;
      powerNodes.forEach(node => node.classList.remove("!brightness-150"));
      const containingNode = powerNodes.find(
        el =>
          event.target &&
          (el === event.target || el.contains(event.target as any))
      );
      if (containingNode) {
        containingNode.classList.add("!brightness-150");
      }
      if (draggingSystemRef.current) {
        draggingSystemRef.current.style.left = `${x}px`;
        draggingSystemRef.current.style.top = `${y}px`;
      }
    }

    document.addEventListener("pointermove", handleDrag);

    document.addEventListener(
      "pointerup",
      event => {
        const containingNode = powerNodes.find(
          el =>
            event.target &&
            (el === event.target || el.contains(event.target as any))
        );
        if (
          containingNode &&
          containingNode instanceof HTMLDivElement &&
          !isNaN(Number(containingNode.dataset.nodeid))
        ) {
          q.powerGrid.powerNodes.transferSystem.netSend({
            nodeId: Number(containingNode.dataset.nodeid),
            systemId: system.id,
          });
        }
        document.body.classList.remove("drag-active");
        powerNodes.forEach(node => node.classList.remove("!brightness-150"));

        document.removeEventListener("pointermove", handleDrag);
        setDraggingSystem(null);
      },
      {once: true}
    );
  }

  return (
    <>
      <div className="relative grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-16 h-full">
        <Portal>
          <div
            className={clsx(
              "fixed rounded text-white border-white/50 bg-black/80 border p-2 flex flex-col z-30 whitespace-nowrap pointer-events-none",
              draggingSystem ? "block" : "hidden"
            )}
            ref={draggingSystemRef}
          >
            <strong>{draggingSystem?.name}</strong>
          </div>
        </Portal>
        <svg
          style={{
            transform: cardArea
              ? `translate(${cardArea.x * -1}px, ${cardArea.y * -1}px)`
              : undefined,
          }}
          className="absolute w-screen h-screen inset-0 z-0 pointer-events-none"
        >
          <Connector ref={draggingRef} />
          {Object.entries(powerToBatteries).map(([inId, outIds]) =>
            outIds.map(outId => (
              <SketchyConnector
                key={`${inId}-${outId}`}
                in={Number(inId)}
                out={outId}
                cardLoaded={cardLoaded}
                revalidate={{...powerToBatteries, ...powerToNodes}}
              />
            ))
          )}
          {Object.entries(powerToNodes).map(([inId, outIds]) =>
            outIds.map(outId => (
              <SketchyConnector
                key={`${inId}-${outId}`}
                in={Number(inId)}
                out={outId}
                cardLoaded={cardLoaded}
                revalidate={{...powerToBatteries, ...powerToNodes}}
              />
            ))
          )}
        </svg>
        <div className="z-10 reactors h-full flex flex-col gap-4 items-center justify-evenly">
          {reactors.map(reactor => (
            <Reactor key={reactor.id} {...reactor}>
              <div className="absolute right-0 top-0 h-full flex items-center translate-x-1/2">
                <ConnectionPoint
                  handleDrag={handleDrag}
                  side="out"
                  id={reactor.id}
                />
              </div>
            </Reactor>
          ))}
        </div>
        <div className="z-10 batteries h-full flex flex-col gap-4 justify-evenly items-center">
          {batteries.map(battery => (
            <Battery key={battery.id} {...battery}>
              <div className="absolute right-0 top-0 h-full flex items-center translate-x-1/2">
                <ConnectionPoint
                  handleDrag={handleDrag}
                  side="out"
                  id={battery.id}
                />
              </div>
              <div className="absolute  left-0 top-0 h-full flex flex-col justify-evenly items-center -translate-x-1/2">
                <ConnectionPoint
                  handleDrag={handleDrag}
                  side="in"
                  id={battery.id}
                />
                {powerToBatteries[battery.id]?.map((id, i) => (
                  <ConnectionPoint
                    key={i}
                    handleDrag={handleDrag}
                    side="in"
                    id={battery.id}
                    outId={id}
                  />
                ))}
              </div>
            </Battery>
          ))}
        </div>
        <div className="z-10 powerNodes h-full grid grid-cols-1 items-center justify-start">
          {powerNodes.map(powerNode => (
            <PowerNode
              key={powerNode.id}
              {...powerNode}
              setDragging={setDragging}
            >
              <div className="absolute  left-0 top-0 h-full flex flex-col justify-evenly items-center -translate-x-1/2">
                <ConnectionPoint
                  handleDrag={handleDrag}
                  side="in"
                  id={powerNode.id}
                />
                {powerToNodes[powerNode.id]?.map((id, i) => (
                  <ConnectionPoint
                    key={i}
                    handleDrag={handleDrag}
                    side="in"
                    id={powerNode.id}
                    outId={id}
                  />
                ))}
              </div>
            </PowerNode>
          ))}
        </div>
      </div>
    </>
  );
}

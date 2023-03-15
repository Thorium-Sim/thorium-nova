import {CardProps} from "@client/components/Station/CardProps";
import {q} from "@client/context/AppContext";
import type {AppRouter} from "@server/init/router";
import {inferTransformedProcedureOutput} from "@thorium/live-query/server/types";
import {capitalCase} from "change-case";
import {
  PointerEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {BsNodePlusFill} from "react-icons/bs";
import {
  GiAtomicSlashes,
  GiBattery0,
  GiBattery100,
  GiBattery25,
  GiBattery50,
  GiBattery75,
  GiOilDrum,
} from "react-icons/gi";
import {HiOutlineFire, HiOutlineLightningBolt} from "react-icons/hi";
import {TbAtom2} from "react-icons/tb";
import {ReactorSlider} from "./ReactorSlider";
import {Portal} from "@headlessui/react";
import clsx from "clsx";
import {Connector, ConnectorHandle} from "./Connector";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import useInterval from "@client/hooks/useInterval";

type ReactorItem = inferTransformedProcedureOutput<
  AppRouter["powerGrid"]["reactors"]["get"]
>[0];

type BatteryItem = inferTransformedProcedureOutput<
  AppRouter["powerGrid"]["batteries"]["get"]
>[0];

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
      className="p-2 cursor-grab "
      onPointerDown={handleDrag}
      data-side={side}
      data-id={id}
      data-outid={outId}
    >
      <div className="w-3 h-3 rounded-full  bg-gray-900 border-2 border-white shadow-white shadow-sm pointer-events-none"></div>
    </div>
  );
}

function Reactor({
  id,
  name,
  desiredOutput,
  maxOutput,
  optimalOutputPercent,
  nominalHeat,
  maxSafeHeat,
  maxHeat,
  reserve,
  fuel,
  children,
}: ReactorItem & {children: ReactNode}) {
  const currentHeat = maxSafeHeat;
  const powerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (powerRef.current) {
      powerRef.current.value = desiredOutput.toString();
    }
  }, [desiredOutput]);

  return (
    <div className="relative w-full py-2 px-4 panel panel-primary flex items-center gap-2">
      {children}
      <TbAtom2 className="text-5xl" />
      <div className="flex-1">
        <div className="flex items-center gap-2" title="Power Output">
          <HiOutlineLightningBolt className="text-3xl" />

          <ReactorSlider
            aria-label="Desired Power"
            minValue={0}
            maxValue={maxOutput}
            step={0.1}
            className="flex-1"
            value={desiredOutput}
            reactorId={id}
            maxOutput={maxOutput}
            onChange={value => {
              if (typeof value === "number")
                q.powerGrid.reactors.setDesired.netSend({
                  reactorId: id,
                  desiredOutput: value,
                });
            }}
          />
          <span className="whitespace-nowrap tabular-nums">{maxOutput} MW</span>
        </div>
      </div>
      <div
        className="flex flex-col items-center gap-2 cursor-help"
        title={`Heat: ${currentHeat}˚ K`}
      >
        <div className="min-h-full h-10 aspect-square -rotate-90 flex items-center -mx-4">
          <meter
            className="w-full"
            value={currentHeat}
            min={nominalHeat}
            max={maxHeat}
          />
        </div>
        <HiOutlineFire className="text-xl" />
      </div>

      <div
        className="flex flex-col items-center gap-2 cursor-help"
        title={`Active Fuel: ${(fuel * 100).toFixed(0)}%`}
      >
        <div className="min-h-full h-10 aspect-square -rotate-90 flex items-center -mx-4">
          <meter className="w-full" value={fuel} min={0} max={1} />
        </div>
        <GiAtomicSlashes className="text-xl" />
      </div>
      <div
        className="flex flex-col items-center gap-2  cursor-help"
        title="Fuel Reserve"
      >
        <div className="min-h-full h-10 aspect-square -rotate-90 flex items-center -mx-4">
          <meter className="w-full" value={reserve} min={0} max={1} />
        </div>
        <GiOilDrum className="text-xl" />
      </div>
    </div>
  );
}

function Battery({
  capacity,
  id,
  storage,
  chargeAmount,
  dischargeAmount,
  chargeRate,
  dischargeRate,
  children,
}: BatteryItem & {
  children: ReactNode;
}) {
  const percentage = storage / capacity;
  let BatteryComp = GiBattery0;
  switch (true) {
    case percentage > 0.95:
      BatteryComp = GiBattery100;
      break;
    case percentage > 0.75:
      BatteryComp = GiBattery75;
      break;
    case percentage > 0.5:
      BatteryComp = GiBattery50;
      break;
    case percentage > 0.2:
      BatteryComp = GiBattery25;
      break;
  }

  return (
    <div className="items-center relative max-w-max px-4 py-2 panel panel-warning flex text-4xl z-50 ">
      <div
        className="h-full cursor-help"
        title={`Charge Rate: ${((chargeAmount / chargeRate) * 100).toFixed(
          0
        )}%`}
      >
        <div className="min-h-full aspect-square -rotate-90 -ml-4 -mr-2">
          <meter
            className="w-full h-4"
            value={chargeAmount / chargeRate}
            min={0}
            max={1}
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <BatteryComp />
        <span className="text-lg tabular-nums">
          {Math.round(percentage * 100)}%
        </span>
      </div>
      <div
        className="h-full cursor-help"
        title={`Discharge Rate: ${(
          (dischargeAmount / dischargeRate) *
          100
        ).toFixed(0)}%`}
      >
        <div className="min-h-full aspect-square -rotate-90 -ml-2 -mr-4">
          <meter
            className="w-full h-4"
            value={dischargeAmount / dischargeRate}
            min={0}
            max={1}
          />
        </div>
      </div>

      {children}
    </div>
  );
}

function SketchyConnector({
  out,
  in: inId,
  cardLoaded,
}: {
  out: number;
  in: number;
  cardLoaded: boolean;
  revalidate: any;
}) {
  const connectorRef = useRef<ConnectorHandle>(null);

  const handleAdjust = useCallback(() => {
    const outDims = document
      .querySelector(`[data-id="${out}"]`)
      ?.getBoundingClientRect();
    const inDims = document
      .querySelector(`[data-id="${inId}"][data-outid="${out}"]`)
      ?.getBoundingClientRect();

    if (outDims && inDims) {
      connectorRef.current?.update({
        from: {
          x: outDims.x + outDims.width / 2,
          y: outDims.y + outDims.height / 2,
        },
        to: {x: inDims.x + inDims.width / 2, y: inDims.y + inDims.height / 2},
        visible: cardLoaded,
      });
    }
  }, [cardLoaded, inId, out]);

  useEffect(() => {
    window.addEventListener("resize", handleAdjust);
    return () => window.removeEventListener("resize", handleAdjust);
  }, [handleAdjust]);

  useEffect(() => {
    handleAdjust();
  });

  return <Connector ref={connectorRef} />;
}
export function PowerGrid({cardLoaded}: CardProps) {
  // Refetch every second, that's all that we really need.
  const [reactors] = q.powerGrid.reactors.get.useNetRequest(undefined, {
    refetchInterval: 1000,
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

  const cardArea = document
    .querySelector(".card-area")
    ?.getBoundingClientRect();

  return (
    <>
      <div className="relative grid grid-cols-3 gap-16 h-full">
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
        <div className="z-10 powerNodes h-full flex flex-col gap-4 items-center justify-evenly">
          {powerNodes.map(powerNode => (
            <div
              key={powerNode.id}
              className="relative p-4  panel panel-info text-5xl"
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
              <BsNodePlusFill />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

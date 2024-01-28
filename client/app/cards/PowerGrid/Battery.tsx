import {ReactNode, useRef} from "react";
import useAnimationFrame from "@client/hooks/useAnimationFrame";
import {useLiveQuery} from "@thorium/live-query/client";
import type {AppRouter} from "@server/init/router";
import {inferTransformedProcedureOutput} from "@thorium/live-query/server/types";
import {Icon} from "@thorium/ui/Icon";

type BatteryItem = inferTransformedProcedureOutput<
  AppRouter["powerGrid"]["batteries"]["get"]
>[0];

export function Battery({
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

  const chargeRef = useRef<HTMLDivElement>(null);
  const chargeMeter = useRef<HTMLMeterElement>(null);
  const dischargeRef = useRef<HTMLDivElement>(null);
  const dischargeMeter = useRef<HTMLMeterElement>(null);
  const batteryRef100 = useRef<HTMLDivElement>(null);
  const batteryRef75 = useRef<HTMLDivElement>(null);
  const batteryRef50 = useRef<HTMLDivElement>(null);
  const batteryRef25 = useRef<HTMLDivElement>(null);
  const batteryRef0 = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLSpanElement>(null);

  const {interpolate} = useLiveQuery();
  useAnimationFrame(() => {
    const batteryValues = interpolate(id);
    if (!batteryValues) return;
    const {x: storage, y: chargeAmount, z: dischargeAmount} = batteryValues;

    if (chargeRef.current) {
      chargeRef.current.title = `Charge Rate: ${(
        (chargeAmount / chargeRate) *
        100
      ).toFixed(0)}%`;
    }
    if (chargeMeter.current) {
      chargeMeter.current.value = chargeAmount / chargeRate;
    }
    if (dischargeRef.current) {
      dischargeRef.current.title = `Discharge Rate: ${(
        (dischargeAmount / dischargeRate) *
        100
      ).toFixed(0)}%`;
    }
    if (dischargeMeter.current) {
      dischargeMeter.current.value = dischargeAmount / dischargeRate;
    }

    const percentage = storage / capacity;
    batteryRef100.current?.classList.add("hidden");
    batteryRef75.current?.classList.add("hidden");
    batteryRef50.current?.classList.add("hidden");
    batteryRef25.current?.classList.add("hidden");
    batteryRef0.current?.classList.add("hidden");
    switch (true) {
      case percentage > 0.95:
        batteryRef100.current?.classList.remove("hidden");
        break;
      case percentage > 0.6:
        batteryRef75.current?.classList.remove("hidden");
        break;
      case percentage > 0.4:
        batteryRef50.current?.classList.remove("hidden");
        break;
      case percentage > 0.1:
        batteryRef25.current?.classList.remove("hidden");
        break;
      default:
        batteryRef0.current?.classList.remove("hidden");
    }

    if (percentageRef.current) {
      percentageRef.current.innerText = `${Math.round(percentage * 100)}%`;
    }
  });
  return (
    <div className="items-center relative max-w-max px-4 py-2 panel panel-warning flex text-4xl z-50 ">
      <div
        ref={chargeRef}
        className="h-full cursor-help"
        title={`Charge Rate: ${((chargeAmount / chargeRate) * 100).toFixed(
          0
        )}%`}
      >
        <div className="min-h-full aspect-square -rotate-90 -ml-4 -mr-2">
          <meter
            ref={chargeMeter}
            className="w-full h-4"
            value={chargeAmount / chargeRate}
            min={0}
            max={1}
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div ref={batteryRef100}>
          <Icon name="battery-100" />
        </div>
        <div ref={batteryRef75}>
          <Icon name="battery-75" />
        </div>
        <div ref={batteryRef50}>
          <Icon name="battery-50" />
        </div>
        <div ref={batteryRef25}>
          <Icon name="battery-25" />
        </div>
        <div ref={batteryRef0}>
          <Icon name="battery-0" />
        </div>
        <span className="text-lg tabular-nums" ref={percentageRef}>
          {Math.round(percentage * 100)}%
        </span>
      </div>
      <div
        ref={dischargeRef}
        className="h-full cursor-help"
        title={`Discharge Rate: ${(
          (dischargeAmount / dischargeRate) *
          100
        ).toFixed(0)}%`}
      >
        <div className="min-h-full aspect-square -rotate-90 -ml-2 -mr-4">
          <meter
            ref={dischargeMeter}
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

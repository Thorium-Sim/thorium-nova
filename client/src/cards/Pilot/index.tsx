import Button from "@thorium/ui/Button";
import {CardProps} from "client/src/components/Station/CardProps";
import {useDataStream} from "client/src/context/useDataStream";
import {Suspense} from "react";
import {GridCanvas, CircleGrid} from "./CircleGrid";
import {PilotZoomSlider} from "./PilotZoomSlider";
import {usePilotStore} from "./usePilotStore";
import {ImpulseControls} from "./ImpulseControls";
import {Joystick, LinearJoystick} from "@thorium/ui/Joystick";
import {ReactNode} from "react";
import type {Coordinates} from "server/src/utils/unitTypes";
import {netSend} from "client/src/context/netSend";

async function rotation({x = 0, y = 0, z = 0}: Partial<Coordinates<number>>) {
  await netSend("thrustersSetRotationDelta", {rotation: {x, y, z}});
}
async function direction({x = 0, y = 0, z = 0}: Partial<Coordinates<number>>) {
  await netSend("thrustersSetDirection", {direction: {x, y, z}});
}

function UntouchableLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`select-none pointer-events-none absolute ${className}`}>
      {children}
    </p>
  );
}

export function Pilot({cardLoaded}: CardProps) {
  useDataStream({systemId: null});

  return (
    <div className="grid grid-cols-4 h-full place-content-center gap-4">
      <div className="flex flex-col justify-between">
        <ImpulseControls cardLoaded={cardLoaded} />
        <div className="flex gap-4 w-full flex-1">
          <LinearJoystick onDrag={({y}) => direction({z: -y})} vertical>
            <UntouchableLabel className="top-1">Fore</UntouchableLabel>
            <UntouchableLabel className="bottom-1">Aft</UntouchableLabel>
          </LinearJoystick>
          <Joystick
            className="flex-1"
            onDrag={({x, y}) => direction({y: -y, x: -x})}
          >
            <UntouchableLabel className="bottom-1">Down</UntouchableLabel>
            <UntouchableLabel className="top-1">Up</UntouchableLabel>
            <UntouchableLabel className="right-1">Starboard</UntouchableLabel>
            <UntouchableLabel className="left-1">Port</UntouchableLabel>
          </Joystick>
        </div>
      </div>
      <div className="col-span-2 h-full">
        <Suspense fallback={null}>
          <GridCanvas shouldRender={cardLoaded}>
            <CircleGrid />
          </GridCanvas>
        </Suspense>
      </div>

      <div className="h-full flex flex-col justify-between gap-4">
        <div>Course controls here</div>
        <div>
          <PilotZoomSlider />
          <Button
            className="w-full btn-primary"
            onClick={() =>
              usePilotStore.setState(({tilt: t}) => ({
                tilt: t === 0 ? 0.5 : t === 0.5 ? 1 : 0,
              }))
            }
          >
            Tilt Sensor View
          </Button>
        </div>
        <div className="flex-1"></div>
        <Joystick onDrag={({x, y}) => rotation({z: x, x: y})}>
          <UntouchableLabel className="bottom-1">Pitch Down</UntouchableLabel>
          <UntouchableLabel className="top-1">Pitch Up</UntouchableLabel>
          <UntouchableLabel className="right-1">
            Starboard Roll
          </UntouchableLabel>
          <UntouchableLabel className="left-1">Port Roll</UntouchableLabel>
        </Joystick>
        <LinearJoystick onDrag={({x}) => rotation({y: -x})}>
          <UntouchableLabel className="left-1">Port Yaw</UntouchableLabel>
          <UntouchableLabel className="right-1">Starboard Yaw</UntouchableLabel>
        </LinearJoystick>
      </div>
    </div>
  );
}

import Button from "@thorium/ui/Button";
import {CardProps} from "client/src/components/Station/CardProps";
import {useDataStream} from "client/src/context/useDataStream";
import {Suspense} from "react";
import {Object3D, Quaternion} from "three";
import {GridCanvas, CircleGrid} from "./CircleGrid";
import {PilotZoomSlider} from "./PilotZoomSlider";
import {usePilotStore} from "./usePilotStore";

window.Object3D = Object3D;
export function Pilot({cardLoaded}: CardProps) {
  useDataStream();

  return (
    <div className="grid grid-cols-4 h-full place-content-center gap-4">
      <div className="bg-purple-500 h-full">
        <div>Impulse controls here</div>
        <div>Thruster direction here here</div>
      </div>
      <div className="col-span-2 h-full">
        <Suspense fallback={null}>
          <GridCanvas shouldRender={cardLoaded}>
            <CircleGrid />
          </GridCanvas>
        </Suspense>
      </div>
      <div className="h-full">
        <div>Course controls here</div>
        <div>
          <PilotZoomSlider />
          <Button
            className="w-full btn-primary"
            onClick={() =>
              usePilotStore.setState(({tilt: t}) => ({
                tilt: t == 0 ? 0.5 : t === 0.5 ? 1 : 0,
              }))
            }
          >
            Tilt Sensor View
          </Button>
        </div>
        <div>Thruster rotation here</div>
      </div>
    </div>
  );
}

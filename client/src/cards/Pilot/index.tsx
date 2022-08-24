import {CardProps} from "client/src/components/Station/CardProps";
import {useDataStream} from "client/src/context/useDataStream";

import {ImpulseControls} from "./ImpulseControls";

export function Pilot({cardLoaded}: CardProps) {
  useDataStream({systemId: null});

  return (
    <div className="grid grid-cols-4 h-full place-content-center gap-4">
      <div className="h-full">
        <ImpulseControls cardLoaded={cardLoaded} />
        <div>Thruster direction here here</div>
      </div>
      <div className="col-span-2 h-full">
        <div className="aspect-square w-full max-h-full bg-orange-400"></div>
      </div>
      <div className="bg-purple-500 h-full">
        <div>Course controls here</div>
        <div>Camera controls here</div>
        <div>Thruster rotation here</div>
      </div>
    </div>
  );
}

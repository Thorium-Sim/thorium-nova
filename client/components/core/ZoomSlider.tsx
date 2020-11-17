import React from "react";
import {useConfigStore} from "../starmap/configStore";
import Slider from "../ui/Slider";

const zoomMin = 1;
const zoomMax = 30000000000;
function logslider(position: number, reverse?: boolean) {
  // position will be between 0 and 100
  var minP = 0;
  var maxP = 100;

  // The result should be between 100 an 10000000
  var minV = Math.log(zoomMin);
  var maxV = Math.log(zoomMax);

  // calculate adjustment factor
  var scale = (maxV - minV) / (maxP - minP);
  if (reverse) return (Math.log(position) - minV) / scale + minP;
  return Math.exp(minV + scale * (position - minP));
}

export const ZoomSlider = () => {
  const cameraZoom = useConfigStore(store => store.cameraVerticalDistance);

  return (
    <div
      className={`pointer-events-none absolute bottom-0 right-0 w-64 py-6 px-4`}
    >
      <p>Zoom</p>
      <Slider
        min={0}
        max={100}
        step={0.1}
        value={logslider(cameraZoom, true)}
        onChange={e =>
          useConfigStore
            .getState()
            .orbitControlsSet({zoom: logslider(parseFloat(e.target.value))})
        }
      />
    </div>
  );
};

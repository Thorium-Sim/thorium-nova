import React from "react";
import Slider from "../ui/Slider";

export const ZoomSlider = ({
  value,
  setValue,
  zoomMin = 1,
  zoomMax = 30000000000,
  step = 0.1,
}: {
  value: number;
  setValue: (val: number) => void;
  zoomMin?: number;
  zoomMax?: number;
  step?: number;
}) => {
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

  return (
    <div
      className={`pointer-events-none absolute bottom-0 right-0 w-64 py-6 px-4`}
    >
      <p>Zoom</p>
      <Slider
        min={0}
        max={100}
        step={step}
        value={logslider(value, true)}
        onChange={e => setValue(logslider(parseFloat(e.target.value)))}
      />
    </div>
  );
};

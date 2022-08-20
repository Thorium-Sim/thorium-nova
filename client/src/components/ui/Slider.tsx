import {logslider} from "client/src/utils/logSlider";
import React, {ChangeEvent} from "react";

const Slider = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
) => {
  return <input className="slider" {...props} type="range" />;
};

export default Slider;

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
  return (
    <Slider
      min={0}
      max={100}
      step={step}
      value={logslider(zoomMin, zoomMax, value, true) || 0}
      className="slider zoom"
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        setValue(logslider(zoomMin, zoomMax, parseFloat(e.target.value)))
      }
    />
  );
};

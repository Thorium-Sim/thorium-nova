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
    <Slider
      min={0}
      max={100}
      step={step}
      value={logslider(value, true) || 0}
      className="slider zoom"
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        setValue(logslider(parseFloat(e.target.value)))
      }
    />
  );
};

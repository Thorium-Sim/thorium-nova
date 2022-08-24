import React, {ChangeEvent} from "react";

import {SliderState, useSliderState} from "react-stately";

import {
  mergeProps,
  useFocusRing,
  useNumberFormatter,
  useSlider,
  useSliderThumb,
  VisuallyHidden,
  AriaSliderProps,
  AriaSliderThumbOptions,
} from "react-aria";

import {NumberFormatOptions} from "@internationalized/number";

function Slider(
  props: AriaSliderProps & {
    formatOptions?: NumberFormatOptions;
    className?: string;
  }
) {
  let trackRef = React.useRef(null);
  let numberFormatter = useNumberFormatter(props.formatOptions);
  let state = useSliderState({...props, numberFormatter});
  let {groupProps, trackProps, labelProps, outputProps} = useSlider(
    props,
    state,
    trackRef
  );

  return (
    <div
      {...groupProps}
      className={`slider ${state.orientation} ${props.className}`}
    >
      {/* Create a container for the label and output element. */}
      {props.label && (
        <div className="label-container">
          <label {...labelProps}>{props.label}</label>
          <output {...outputProps}>{state.getThumbValueLabel(0)}</output>
        </div>
      )}
      {/* The track element holds the visible track line and the thumb. */}
      <div
        {...trackProps}
        ref={trackRef}
        className={`track ${state.isDisabled ? "disabled" : ""}`}
      >
        <Thumb index={0} state={state} trackRef={trackRef} />
      </div>
    </div>
  );
}

function Thumb(
  props: {state: SliderState} & Omit<AriaSliderThumbOptions, "inputRef">
) {
  let {state, trackRef, index} = props;
  let inputRef = React.useRef(null);
  let {thumbProps, inputProps, isDragging} = useSliderThumb(
    {
      index,
      trackRef,
      inputRef,
    },
    state
  );

  let {focusProps, isFocusVisible} = useFocusRing();
  return (
    <div
      {...thumbProps}
      className={`thumb ${isFocusVisible ? "focus" : ""} ${
        isDragging ? "dragging" : ""
      }`}
    >
      <VisuallyHidden>
        <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
      </VisuallyHidden>
    </div>
  );
}

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
      aria-label="Zoom"
      minValue={0}
      maxValue={100}
      step={step}
      value={logslider(value, true) || 0}
      className="slider zoom"
      onChange={(val: number | number[]) => setValue(logslider(val as number))}
    />
  );
};

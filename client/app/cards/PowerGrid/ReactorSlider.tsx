import React from "react";

import {type SliderState, useSliderState} from "react-stately";

import {
  mergeProps,
  useFocusRing,
  useNumberFormatter,
  useSlider,
  useSliderThumb,
  VisuallyHidden,
  type 
  AriaSliderProps,
  type 
  AriaSliderThumbOptions,
} from "react-aria";

import type {NumberFormatOptions} from "@internationalized/number";
import {useLiveQuery} from "@thorium/live-query/client";
import useAnimationFrame from "@client/hooks/useAnimationFrame";

export function ReactorSlider(
  props: AriaSliderProps & {
    formatOptions?: NumberFormatOptions;
    className?: string;
    reactorId: number;
    maxOutput: number;
  }
) {
  const trackRef = React.useRef(null);
  const powerBarRef = React.useRef<HTMLDivElement>(null);
  const numberFormatter = useNumberFormatter(props.formatOptions);
  const state = useSliderState({...props, numberFormatter});
  const {groupProps, trackProps, labelProps, outputProps} = useSlider(
    props,
    state,
    trackRef
  );

  const {interpolate} = useLiveQuery();
  useAnimationFrame(() => {
    const power = interpolate(props.reactorId)?.x;
    if (powerBarRef.current && typeof power === "number") {
      let percent = (power / props.maxOutput) * 100;
      if (percent < 1) percent = 0;
      powerBarRef.current.style.width = `${percent}%`;
    }
  });
  return (
    <div
      {...groupProps}
      className={`slider ${state.orientation} ${props.className} pointer-events-auto`}
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
        <div className="absolute left-0 h-full w-[calc(100%+1.5rem)] -translate-x-3">
          <div
            ref={powerBarRef}
            className="from-yellow-500/70 to-orange-500/70 bg-gradient-to-r rounded-full h-[calc(100%-0.5rem)] translate-y-1"
          />
        </div>
        <Thumb index={0} state={state} trackRef={trackRef} />
      </div>
    </div>
  );
}

function Thumb(
  props: {state: SliderState} & Omit<AriaSliderThumbOptions, "inputRef">
) {
  const {state, trackRef, index} = props;
  const inputRef = React.useRef(null);
  const {thumbProps, inputProps, isDragging} = useSliderThumb(
    {
      index,
      trackRef,
      inputRef,
    },
    state
  );

  const {focusProps, isFocusVisible} = useFocusRing();
  return (
    <div
      {...thumbProps}
      className={`thumb relative ${isFocusVisible ? "focus" : ""} ${
        isDragging ? "dragging" : ""
      }`}
    >
      {state.isThumbDragging(0) && (
        <span className="absolute -top-8 inset-x-0 tabular-nums text-center">
          {state.values[0].toFixed(1)}
        </span>
      )}
      <VisuallyHidden>
        <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
      </VisuallyHidden>
    </div>
  );
}

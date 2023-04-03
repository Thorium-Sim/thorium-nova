import {logslider} from "client/src/utils/logSlider";
import React from "react";

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
import {Tooltip} from "@thorium/ui/Tooltip";

export function SystemSlider(
  props: AriaSliderProps & {
    formatOptions?: NumberFormatOptions;
    className?: string;
    powerDraw: number;
    maxOutput: number;
    requiredPower: number;
    defaultPower: number;
    maxSafePower: number;
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
  let percent = (props.powerDraw / props.maxOutput) * 100;
  if (percent < 1) percent = 0;

  return (
    <div
      {...groupProps}
      className={`slider ${state.orientation} ${props.className} pointer-events-auto`}
    >
      {/* Create a container for the label and output element. */}
      {props.label && (
        <div className="label-container ">
          <label {...labelProps}>{props.label}</label>
        </div>
      )}
      {/* The track element holds the visible track line and the thumb. */}
      <div
        {...trackProps}
        ref={trackRef}
        aria-label="System Power"
        className={`track ${state.isDisabled ? "disabled" : ""}`}
      >
        <div className="absolute left-0 h-full w-[calc(100%+1.5rem)] -translate-x-3">
          <div
            className="from-yellow-500/70 to-orange-500/70 bg-gradient-to-r h-[calc(100%-0.5rem)] translate-y-1"
            style={{
              width: `${percent}%`,
              borderTopLeftRadius: "9999px",
              borderBottomLeftRadius: "9999px",
              borderTopRightRadius: `${
                percent > 90 ? (percent - 90) * 999 : 0
              }px`,
              borderBottomRightRadius: `${
                percent > 90 ? (percent - 90) * 999 : 0
              }px`,
            }}
          />
        </div>
        <Tooltip content="Minimum Required Power">
          <div
            className="absolute border-l-2 border-yellow-500 h-[calc(100%-4px)] translate-y-0.5"
            style={{
              left: `${(props.requiredPower / props.maxOutput) * 100}%`,
            }}
          />
        </Tooltip>
        <Tooltip content="Maximum Safe Power">
          <div
            className="absolute border-l-2 border-yellow-500 h-[calc(100%-4px)] translate-y-0.5"
            style={{
              left: `${(props.maxSafePower / props.maxOutput) * 100}%`,
            }}
          />
        </Tooltip>
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
      className={`thumb relative ${isFocusVisible ? "focus" : ""} ${
        isDragging ? "dragging" : ""
      }`}
    >
      {state.isThumbDragging(0) && (
        <span className="absolute -bottom-6 inset-x-0 tabular-nums text-center whitespace-nowrap drop-shadow-sm">
          {state.values[0].toFixed(1)}
        </span>
      )}
      <VisuallyHidden>
        <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
      </VisuallyHidden>
    </div>
  );
}

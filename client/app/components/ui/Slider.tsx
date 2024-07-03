import { logslider } from "@client/utils/logSlider";
import React from "react";

import { type SliderState, useSliderState } from "react-stately";

import {
	mergeProps,
	useFocusRing,
	useNumberFormatter,
	useSlider,
	useSliderThumb,
	VisuallyHidden,
	type AriaSliderProps,
	type AriaSliderThumbOptions,
} from "react-aria";

import type { NumberFormatOptions } from "@internationalized/number";

function Slider(
	props: AriaSliderProps & {
		formatOptions?: NumberFormatOptions;
		className?: string;
	},
) {
	const trackRef = React.useRef(null);
	const numberFormatter = useNumberFormatter(props.formatOptions);
	const state = useSliderState({ ...props, numberFormatter });
	const { groupProps, trackProps, labelProps, outputProps } = useSlider(
		props,
		state,
		trackRef,
	);

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
				<Thumb index={0} state={state} trackRef={trackRef} />
			</div>
		</div>
	);
}

function Thumb(
	props: { state: SliderState } & Omit<AriaSliderThumbOptions, "inputRef">,
) {
	const { state, trackRef, index } = props;
	const inputRef = React.useRef(null);
	const { thumbProps, inputProps, isDragging } = useSliderThumb(
		{
			index,
			trackRef,
			inputRef,
		},
		state,
	);

	const { focusProps, isFocusVisible } = useFocusRing();
	return (
		<div
			{...thumbProps}
			className={`thumb ${isFocusVisible ? "focus" : ""} ${
				isDragging ? "dragging" : ""
			}`}
		>
			<VisuallyHidden>
				<input
					ref={inputRef}
					{...mergeProps(inputProps, focusProps)}
					value={Number.isNaN(inputProps.value) ? 0 : inputProps.value}
				/>
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
	return (
		<Slider
			aria-label="Zoom"
			minValue={0}
			maxValue={100}
			step={step}
			value={logslider(zoomMin, zoomMax, value, true) || 0}
			className="slider zoom"
			onChange={(val: number | number[]) =>
				setValue(logslider(zoomMin, zoomMax, val as number))
			}
		/>
	);
};

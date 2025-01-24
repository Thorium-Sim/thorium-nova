import { cn } from "@thorium/utils/cn";
import type React from "react";
import type { ReactNode } from "react";

export const RangeInput = (
	props: Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		"value" | "defaultValue" | "placeholder" | "onBlur"
	> & {
		label: ReactNode;
		labelHidden?: boolean;
		isInvalid?: boolean;
		invalidMessage?: string;
		fixed?: boolean;
		labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
		helperText?: string;
		value?: [number, number];
		defaultValue?: [number, number];
		placeholder?: [string, string];
		onBlur?: (values: [number, number]) => void;
	},
) => {
	const {
		label,
		labelHidden = false,
		isInvalid,
		invalidMessage,
		fixed,
		labelProps,
		value,
		defaultValue,
		helperText,
		placeholder,
		onBlur,
		...inputProps
	} = props;

	return (
		<div className={`flex flex-col ${fixed ? "" : "w-full"}`}>
			<label
				{...labelProps}
				className={`${labelProps?.className || ""} ${
					labelHidden ? "hidden" : ""
				}`}
			>
				{label}
			</label>
			<div className="flex justify-between w-full gap-2">
				<input
					autoComplete="off"
					{...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
					value={value?.[0]}
					defaultValue={defaultValue?.[0]}
					placeholder={placeholder?.[0]}
					className={cn("flex-1 input w-full", inputProps.className, {
						"border-red-500": isInvalid,
					})}
					onBlur={(event) => {
						if (Number.isNaN(Number.parseFloat(event.target.value))) return;
						onBlur?.([
							Number(event.target.value),
							value?.[1] ?? defaultValue?.[1] ?? 1,
						]);
					}}
				/>
				<input
					autoComplete="off"
					{...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
					value={value?.[0]}
					defaultValue={defaultValue?.[1]}
					placeholder={placeholder?.[1]}
					className={cn("flex-1 input w-full", inputProps.className, {
						"border-red-500": isInvalid,
					})}
					onBlur={(event) => {
						if (Number.isNaN(Number.parseFloat(event.target.value))) return;
						onBlur?.([
							value?.[0] ?? defaultValue?.[0] ?? 1,
							Number(event.target.value),
						]);
					}}
				/>
			</div>
			{isInvalid && <p className="text-red-500">{invalidMessage}</p>}
			{helperText && (
				<p className="text-gray-400 text-sm leading-tight mb-2">{helperText}</p>
			)}
		</div>
	);
};

RangeInput.displayName = "RangeInput";

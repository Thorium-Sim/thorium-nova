import React, { forwardRef, useId, type ReactNode } from "react";

interface CommonProps {
	label: ReactNode;
	labelHidden?: boolean;
	isInvalid?: boolean;
	invalidMessage?: string;
	fixed?: boolean;
	labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
	helperText?: string;
	inputButton?: React.ReactNode;
}
const Input = forwardRef<
	HTMLInputElement,
	| (React.InputHTMLAttributes<HTMLInputElement> & {
			as?: "input";
	  } & CommonProps)
	| (React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
			as: "textarea";
	  } & CommonProps)
	| (React.SelectHTMLAttributes<HTMLSelectElement> & {
			as: "select";
	  } & CommonProps)
>((props, ref) => {
	const {
		label,
		labelHidden = false,
		isInvalid,
		invalidMessage,
		fixed,
		labelProps,
		as = "input",
		helperText,
		inputButton,
		...inputProps
	} = props;

	const id = inputProps.id || useId();

	return (
		<div className={`flex flex-col ${fixed ? "" : "w-full"}`}>
			<label
				htmlFor={id}
				{...labelProps}
				className={`${labelProps?.className || ""} ${labelHidden ? "hidden" : ""}`}
			>
				{label}
			</label>
			<div className="flex w-full justify-between gap-2">
				{React.createElement(as, {
					autoComplete: "off",
					...(inputProps as React.InputHTMLAttributes<HTMLInputElement>),
					ref,
					id,
					className: `flex-1 ${as === "textarea" ? "textarea" : "input"} ${
						inputProps.className
					} ${isInvalid ? "border-red-500" : ""} `,
				})}
				{inputButton}
			</div>
			{isInvalid && <p className="text-red-500">{invalidMessage}</p>}
			{helperText && <p className="mb-2 text-sm leading-tight text-gray-400">{helperText}</p>}
		</div>
	);
});

Input.displayName = "Input";
export default Input;

import React from "react";

interface CommonProps {
  label: string;
  labelHidden?: boolean;
  isInvalid?: boolean;
  invalidMessage?: string;
  fixed?: boolean;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
}
const Input = (
  props:
    | (React.InputHTMLAttributes<HTMLInputElement> & {
        as?: "input" | "textarea";
      } & CommonProps)
    | (React.SelectHTMLAttributes<HTMLSelectElement> & {
        as: "select";
      } & CommonProps)
) => {
  let {
    label,
    labelHidden = false,
    isInvalid,
    invalidMessage,
    fixed,
    labelProps,
    as = "input",
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
      {React.createElement(as, {
        ...(inputProps as React.InputHTMLAttributes<HTMLInputElement>),
        className: `w-full input ${inputProps.className} ${
          isInvalid ? "border-red-500" : ""
        } `,
      })}
      {isInvalid && <p className="text-red-500">{invalidMessage}</p>}
    </div>
  );
};
export default Input;

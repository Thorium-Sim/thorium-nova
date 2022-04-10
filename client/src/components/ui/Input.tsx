import React, {forwardRef} from "react";

interface CommonProps {
  label: string;
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
  let {
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
        {React.createElement(as, {
          ...(inputProps as React.InputHTMLAttributes<HTMLInputElement>),
          ref,
          className: `flex-1 ${as === "textarea" ? "textarea" : "input"} ${
            inputProps.className
          } ${isInvalid ? "border-red-500" : ""} `,
        })}
        {inputButton}
      </div>
      {isInvalid && <p className="text-red-500">{invalidMessage}</p>}
      {helperText && (
        <p className="text-gray-400 text-sm leading-tight mb-2">{helperText}</p>
      )}
    </div>
  );
});
export default Input;

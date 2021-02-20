import * as React from "react";
import {AriaTextFieldOptions, useTextField} from "@react-aria/textfield";
import {useId} from "@react-aria/utils";
import {mergeRefs} from "client/helpers/mergeRefs";

const Input = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "onBlur"> &
    AriaTextFieldOptions & {
      label: string;
      labelHidden?: boolean;
      isInvalid?: boolean;
      invalidMessage?: string;
      inputSize?: "sm" | "md" | "lg";
      onBlur?: any;
      type?: string | "textarea";
      fixed?: boolean;
    }
>((props, outerRef) => {
  let elementId = useId();
  let {label, labelHidden = true, isInvalid, invalidMessage, inputSize} = props;
  let ref = React.useRef<HTMLInputElement>(null);
  const combinedRef = mergeRefs([outerRef, ref]);
  let {labelProps, inputProps} = useTextField(
    {...props, "aria-labelledby": elementId},
    ref
  );

  return (
    <div
      className={`flex flex-col ${props.fixed ? "" : "w-full"} ${
        props.className
      }`}
    >
      <label
        {...labelProps}
        id={elementId}
        className={`${labelProps.className || ""} ${
          labelHidden ? "hidden" : ""
        }`}
      >
        {label}
      </label>
      <input
        {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
        className={`w-full transition-all duration-200 outline-none px-4 py-3 ${
          inputSize === "sm" ? "h-6" : inputSize === "lg" ? "h-12" : "h-10"
        } rounded ${
          isInvalid ? "border-red-500" : "border-whiteAlpha-50"
        } bg-whiteAlpha-100 border focus:border-primary-400 focus:ring`}
        ref={combinedRef}
      />
      {isInvalid && <p className="text-red-500">{invalidMessage}</p>}
    </div>
  );
});

export default Input;

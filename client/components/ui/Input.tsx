import React from "react";
import {AriaTextFieldOptions, useTextField} from "@react-aria/textfield";
import {useId} from "@react-aria/utils";

const Input: React.FC<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> &
    AriaTextFieldOptions & {
      label: string;
      labelHidden?: boolean;
      isInvalid?: boolean;
      invalidMessage?: string;
    }
> = props => {
  let elementId = useId();
  let {label, labelHidden = true, isInvalid, invalidMessage} = props;
  let ref = React.useRef<HTMLInputElement>(null);
  let {labelProps, inputProps} = useTextField(
    {...props, "aria-labelledby": elementId},
    ref
  );

  return (
    <div className={`flex flex-col w-full ${props.className}`}>
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
        {...inputProps}
        className={`w-full transition-all duration-200 outline-none px-4 h-10 rounded ${
          isInvalid ? "border-red-500" : "border-whiteAlpha-50"
        } bg-whiteAlpha-100 border focus:border-primary-400 focus:shadow-outline`}
        ref={ref}
      />
      {isInvalid && <p className="text-red-500">{invalidMessage}</p>}
    </div>
  );
};

export default Input;

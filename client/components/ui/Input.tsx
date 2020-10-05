import React from "react";
import {AriaTextFieldOptions, useTextField} from "@react-aria/textfield";

const Input: React.FC<
  AriaTextFieldOptions &
    React.InputHTMLAttributes<HTMLInputElement> & {label: string}
> = props => {
  let {label} = props;
  let ref = React.useRef<HTMLInputElement>(null);
  let {labelProps, inputProps} = useTextField(props, ref);

  return (
    <div className={`flex flex-col w-full ${props.className}`}>
      <label {...labelProps}>{label}</label>
      <input
        {...inputProps}
        className="w-full transition-all duration-200 outline-none px-4 h-10 rounded border-whiteAlpha-50 bg-whiteAlpha-100 border focus:border-primary-400 focus:shadow-outline"
        ref={ref}
      />
    </div>
  );
};

export default Input;

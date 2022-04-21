import React from "react";

const Checkbox = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & {label: string; helperText?: string}
) => {
  const {label, ...otherProps} = props;
  return (
    <>
      <label className="flex items-center select-none">
        <input
          type="checkbox"
          {...otherProps}
          className={`${props.className} form-checkbox mr-2 text-blue-600`}
        />
        {label}
      </label>
      {props.helperText && (
        <p className="text-gray-400 text-sm leading-tight mb-2">
          {props.helperText}
        </p>
      )}
    </>
  );
};

export default Checkbox;

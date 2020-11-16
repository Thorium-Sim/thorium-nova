import React from "react";

const Checkbox = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & {label: string}
) => {
  const {label, ...otherProps} = props;
  return (
    <label className="flex items-center select-none">
      <input
        type="checkbox"
        {...otherProps}
        className={`${props.className} form-checkbox mr-2 text-blue-600`}
      />
      {label}
    </label>
  );
};

export default Checkbox;

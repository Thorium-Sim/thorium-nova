import React, {ReactNode} from "react";

const Checkbox = (
  props: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & {label: ReactNode; helperText?: string}
) => {
  const {label, helperText, ...otherProps} = props;
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
      {helperText && (
        <p className="text-gray-400 text-sm leading-tight mb-2">{helperText}</p>
      )}
    </>
  );
};

export default Checkbox;

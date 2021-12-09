import {forwardRef} from "react";

// This component should be used for all buttons to make it easy to add user interface sound effects.
export default forwardRef<
  HTMLButtonElement,
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>(function Button(props, ref) {
  const className = `btn ${props.className || ""}`;
  return <button {...props} ref={ref} className={className} />;
});

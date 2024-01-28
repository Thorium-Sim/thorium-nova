import {cn} from "@client/utils/cn";
import React, {forwardRef} from "react";

// This component should be used for all buttons to make it easy to add user interface sound effects.
export default forwardRef<
  HTMLButtonElement,
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>(function Button(props, ref) {
  const className = cn(`btn whitespace-nowrap ${props.className || ""}`);
  return <button {...props} ref={ref} className={className} />;
});

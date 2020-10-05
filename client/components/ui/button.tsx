import React from "react";
import {useButton} from "@react-aria/button";

type VariantColors =
  | "primary"
  | "secondary"
  | "alert"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";
interface ExtraButtonProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "outline" | "ghost" | "solid";
  variantColor?: VariantColors;
  disabled?: boolean;
  active?: boolean;
  to?: string;
  as?: React.ElementType;
}

type FirstParameter<T extends (props: any, ...args: any) => any> = T extends (
  props: infer P,
  ...args: any
) => any
  ? P
  : never;
type AriaButtonProps = FirstParameter<typeof useButton>;

const Button = React.forwardRef<
  HTMLButtonElement,
  AriaButtonProps &
    React.ButtonHTMLAttributes<HTMLButtonElement> &
    ExtraButtonProps
>((props, ref) => {
  let buttonRef = React.useRef<HTMLButtonElement>(null);
  let {buttonProps} = useButton(props, buttonRef);
  let {
    children,
    variant,
    variantColor = "primary",
    as = "button",
    className,
    onPress,
    ...extraProps
  } = props;

  if (variant === "ghost" || variant === "outline") {
    className = `${className} text-${variantColor}-200 bg-transparent hover:bg-${variantColor}-hover active:bg-${variantColor}-active`;
    if (variant === "outline") {
      className = `${className} border-solid border border-current`;
    }
  } else {
    className = `${className} text-gray-800 bg-${variantColor}-200 hover:bg-${variantColor}-300 active:bg-${variantColor}-400`;
  }
  return React.createElement(
    as,
    {
      ...extraProps,
      ...buttonProps,
      ref: buttonRef,
      className: `rounded font-semibold text-lg inline-flex items-center justify-center transition-all duration-200 py-2 px-4 ${className}`,
    },
    children
  );
});

export default Button;

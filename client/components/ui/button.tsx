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

const Button = React.forwardRef(function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & ExtraButtonProps,
  ref
) {
  let {
    children,
    variant,
    variantColor = "primary",
    as = "button",
    className,
    disabled,
    ...extraProps
  } = props;

  if (variant === "ghost" || variant === "outline") {
    className = `${className} text-${variantColor}-200 bg-transparent ${
      disabled
        ? ""
        : `hover:bg-${variantColor}-hover active:bg-${variantColor}-active`
    }`;
    if (variant === "outline") {
      className = `${className} border-solid border border-current`;
    }
  } else {
    className = `${className} text-gray-800 bg-${variantColor}-200 ${
      disabled
        ? ""
        : `hover:bg-${variantColor}-300 active:bg-${variantColor}-400`
    }`;
  }
  if (disabled) {
    className = `${className} cursor-not-allowed filter-disabled`;
  }
  return React.createElement(
    as,
    {
      ref,
      disabled,
      ...extraProps,
      className: `rounded font-semibold text-lg inline-flex items-center justify-center transition-all duration-200 py-2 px-4 ${className}`,
    },
    children
  );
});

export default Button;

import React from "react";

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
    size,
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
  switch (size) {
    case "xs":
      className = `${className} min-w-1 text-sm py-1 px-1`;
      break;
    case "sm":
      className = `${className} min-w-2 text-base py-1 px-2`;
      break;
    default:
    case "md":
      className = `${className} min-w-3 text-lg py-1 px-3`;
      break;
    case "lg":
      className = `${className} min-w-4 text-xl py-1 px-4`;
      break;
  }
  if (size === "xs") {
  }
  return React.createElement(
    as,
    {
      ref,
      disabled,
      ...extraProps,
      className: `rounded font-semibold inline-flex items-center justify-center transition-all duration-200 select-none focus:outline-none focus:ring ${className}`,
    },
    children
  );
});

export default Button;

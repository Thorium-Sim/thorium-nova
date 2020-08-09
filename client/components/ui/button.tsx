import React from "react";
import {Button as ChakraButton, ButtonProps} from "@chakra-ui/core";

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
  variantColor?: VariantColors;
  disabled?: boolean;
  active?: boolean;
  to?: string;
}
const Button: React.FC<ButtonProps & ExtraButtonProps> = props => {
  return <ChakraButton {...props}></ChakraButton>;
};

export default Button;

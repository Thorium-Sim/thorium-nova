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
const Button: React.FC<ButtonProps & {variantColor: VariantColors}> = props => {
  return <ChakraButton {...props}></ChakraButton>;
};

export default Button;

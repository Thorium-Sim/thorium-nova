import React from "react";
import {PseudoBox, PseudoBoxProps} from "@chakra-ui/core";
import {css} from "@emotion/core";

const ListGroupItem: React.FC<
  {
    onClick?: (event: React.MouseEvent<any>) => void;
    selected?: boolean;
    disabled?: boolean;
    size?: "small";
    to?: string;
  } & PseudoBoxProps
> = ({onClick, selected, disabled, size, ...props}) => (
  <PseudoBox
    {...props}
    display="block"
    border="1px solid rgba(0, 0, 0, 0.125)"
    px={size === "small" ? 2 : 4}
    py={size === "small" ? 1 : 2}
    fontSize={size === "small" ? 12 : undefined}
    color={disabled ? "gray.400" : ""}
    pointerEvents={disabled ? "none" : "all"}
    className="list-group-item"
    css={css`
      & + .list-group-item {
        border-top-width: 0;
      }
    `}
    bg={
      size === "small"
        ? "blackAlpha.600"
        : selected
        ? "whiteAlpha.400"
        : "blackAlpha.400"
    }
    cursor="pointer"
    _hover={{
      bg: selected ? "whiteAlpha.500" : "whiteAlpha.50",
    }}
    _first={{
      borderTopLeftRadius: "0.25rem",
      borderTopRightRadius: "0.25rem",
    }}
    _last={{
      borderBottomLeftRadius: "0.25rem",
      borderBottomRightRadius: "0.25rem",
    }}
    onClick={onClick}
  />
);

export default ListGroupItem;

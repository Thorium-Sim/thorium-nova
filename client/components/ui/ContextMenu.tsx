import {css} from "@emotion/core";
import Portal from "@reach/portal";
import React from "react";
import {Tooltip} from "./Tooltip";

const ContextMenu: React.FC<{x: number; y: number}> = ({children, x, y}) => {
  return (
    <Portal>
      <div
        className="fixed top-0 left-0 z-50"
        css={css`
          transform: translate(${x}px, ${y}px);
        `}
      >
        {children}
      </div>
    </Portal>
  );
};
export default ContextMenu;

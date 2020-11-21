import {css} from "@emotion/core";
import Portal from "@reach/portal";
import React from "react";

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

export const ContextMenuOption: React.FC<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
> = ({children, ...props}) => {
  return (
    <button
      className="px-2 py-1  text-left cursor-pointer hover:bg-purple-700 hover:bg-opacity-50 focus:outline-none focus:ring transition-all"
      {...props}
    >
      {children}
    </button>
  );
};

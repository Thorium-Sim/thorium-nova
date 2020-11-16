import {css} from "@emotion/core";
import {useDialog} from "@react-aria/dialog";
import {FocusScope} from "@react-aria/focus";
import {
  OverlayProps,
  useModal,
  useOverlay,
  usePreventScroll,
} from "@react-aria/overlays";

import React from "react";

export const ModalDialog: React.FC<
  {title: String; role?: "dialog" | "alertdialog"} & OverlayProps
> = props => {
  let {title, children} = props;

  // Handle interacting outside the dialog and pressing
  // the Escape key to close the modal.
  let ref = React.useRef<HTMLDivElement>(null);
  let {overlayProps} = useOverlay(props, ref);

  // Prevent scrolling while the modal is open, and hide content
  // outside the modal from screen readers.
  usePreventScroll();
  let {modalProps} = useModal();

  // Get props for the dialog and its title
  let {dialogProps, titleProps} = useDialog(props, ref);

  return (
    <div
      css={css`
        background: rgba(0, 0, 0, 0.5);
        z-index: 100;
      `}
      className="fixed top-0 left-0 bottom-0 right-0 flex justify-center items-start"
    >
      <FocusScope contain restoreFocus autoFocus>
        <div
          {...overlayProps}
          {...dialogProps}
          {...modalProps}
          ref={ref}
          css={css`
            min-width: 32rem;
          `}
          className="mt-32 bg-gray-800 text-white p-6 outline-none"
        >
          <h3 {...titleProps} className="mt-0 text-2xl font-bold">
            {title}
          </h3>
          {children}
        </div>
      </FocusScope>
    </div>
  );
};

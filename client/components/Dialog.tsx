// The async nature of this makes it a little difficult to test
// There are still tests in place, but this file won't count
// towards coverage
/* istanbul ignore file */
import {css} from "@emotion/core";
import {useDialog} from "@react-aria/dialog";
import {FocusScope} from "@react-aria/focus";
import {
  OverlayContainer,
  OverlayProps,
  OverlayProvider,
  useModal,
  useOverlay,
  usePreventScroll,
} from "@react-aria/overlays";
import {mergeRefs} from "../helpers/mergeRefs";
import React from "react";
import Button from "./ui/button";
import {Input} from "@chakra-ui/core";
import OtherInput from "./ui/Input";
function useDisclosure() {
  const [isOpen, setOpen] = React.useState(false);
  const onOpen = React.useCallback(() => {
    setOpen(true);
  }, []);
  const onClose = React.useCallback(() => {
    setOpen(false);
  }, []);
  return {isOpen, onOpen, onClose};
}

interface DialogI {
  header: string;
  body?: string;
  defaultValue?: string;
  type: "alert" | "confirm" | "prompt";
}
const DialogContext = React.createContext<
  ({header, body, defaultValue, type}: DialogI) => Promise<boolean | string>
>(async () => false);

const Dialog: React.FC = ({children}) => {
  const {isOpen, onOpen, onClose} = useDisclosure();
  const [header, setHeader] = React.useState("");
  const [body, setBody] = React.useState("");
  const [type, setType] = React.useState<"alert" | "confirm" | "prompt">(
    "alert"
  );
  const [input, setInput] = React.useState("");

  const btnRef = React.useRef<HTMLButtonElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const resolveRef = React.useRef<(tf: boolean | string) => void>();
  const openConfirm = React.useCallback(
    ({header, body, defaultValue, type}: DialogI) => {
      if (isOpen) return Promise.resolve(false);
      if (resolveRef.current) {
        resolveRef.current(false);
      }
      onOpen();
      setHeader(header);
      setBody(body || "");
      setType(type);
      setInput(defaultValue || "");

      return new Promise<boolean | string>(resolve => {
        resolveRef.current = resolve;
      });
    },
    [isOpen, onOpen]
  );

  // const [inputEl, setInputEl] = React.useState<HTMLInputElement>();

  // const inputRef = React.useCallback(node => {
  //   if (node !== null) {
  //     setInputEl(node);
  //   }
  // }, []);
  // React.useEffect(() => {
  //   if (isOpen && type === "prompt" && inputEl) {
  //     inputEl.setSelectionRange(0, inputEl.value.length);
  //   }
  // }, [inputEl, isOpen, type]);

  React.useEffect(() => {
    function handleReturn(e: KeyboardEvent) {
      if (e.key === "Enter") {
        if (type === "confirm") {
          resolveRef.current?.(true);
        } else if (type === "prompt") {
          resolveRef.current?.(input);
        } else {
          resolveRef.current?.(false);
        }
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleReturn);
      return () => document.removeEventListener("keydown", handleReturn);
    }
  }, [isOpen, input, type, onClose]);

  return (
    <DialogContext.Provider value={openConfirm}>
      <OverlayProvider className="h-full">
        {children}

        {isOpen && (
          <OverlayContainer>
            <ModalDialog
              title={header}
              isOpen
              onClose={() => {
                resolveRef.current?.(false);

                onClose();
              }}
            >
              {type === "prompt" ? (
                <div>
                  <OtherInput
                    label={body || "Response"}
                    value={input}
                    onChange={e => setInput(e)}
                  />
                </div>
              ) : (
                body
              )}
              <div className="flex justify-end mt-4">
                {type !== "alert" && (
                  <Button
                    ref={cancelRef}
                    onClick={() => {
                      resolveRef.current?.(false);
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  // @ts-ignore
                  autoFocus={type !== "prompt"}
                  variantColor="primary"
                  className="ml-3"
                  onClick={() => {
                    resolveRef.current?.(type === "prompt" ? input : true);
                    onClose();
                  }}
                >
                  OK
                </Button>
              </div>
            </ModalDialog>
          </OverlayContainer>
        )}
      </OverlayProvider>
    </DialogContext.Provider>
  );
};

const ModalDialog: React.FC<
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
          className="mt-32 bg-gray-800 text-white p-10"
        >
          <h3 {...titleProps} className="mt-0 text-2xl">
            {title}
          </h3>
          {children}
        </div>
      </FocusScope>
    </div>
  );
};

export function useConfirm() {
  const dialog = React.useContext(DialogContext);

  return ({header, body}: {header: string; body?: string}) =>
    dialog({header, body, type: "confirm"});
}
export function usePrompt() {
  const dialog = React.useContext(DialogContext);

  return ({
    header,
    body,
    defaultValue,
  }: {
    header: string;
    body?: string;
    defaultValue?: string;
  }) => dialog({header, body, defaultValue, type: "prompt"});
}
export function useAlert() {
  const dialog = React.useContext(DialogContext);
  return ({header, body}: {header: string; body?: string}) =>
    dialog({header, body, type: "alert"});
}
export default Dialog;

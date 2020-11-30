// The async nature of this makes it a little difficult to test
// There are still tests in place, but this file won't count
// towards coverage
/* istanbul ignore file */
import {OverlayContainer, OverlayProvider} from "@react-aria/overlays";
import {useDisclosure} from "client/helpers/hooks/useDisclosure";

import React from "react";
import Button from "./ui/button";
import Input from "./ui/Input";
import {ModalDialog} from "./ui/ModalDialog";

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
                  <Input
                    label={body || "Response"}
                    value={input}
                    onChange={(e: string) => setInput(e)}
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

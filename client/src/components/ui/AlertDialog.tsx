import * as React from "react";
import {Dialog, Transition} from "@headlessui/react";
import Button from "./Button";
interface DialogI {
  header: string;
  body?: string;
  defaultValue?: string;
  type: "alert" | "confirm" | "prompt";
  inputProps?: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
}

const DialogContext = React.createContext<
  ({
    header,
    body,
    defaultValue,
    type,
    inputProps,
  }: DialogI) => Promise<boolean | string>
>(async () => false);

export const AlertDialog = ({children}: {children: React.ReactNode}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [header, setHeader] = React.useState("");
  const [body, setBody] = React.useState("");
  const [type, setType] = React.useState<"alert" | "confirm" | "prompt">(
    "alert"
  );
  const [input, setInput] = React.useState("");
  const [inputProps, setInputProps] = React.useState<React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const resolveRef = React.useRef<(tf: boolean | string) => void>();
  const openConfirm = React.useCallback(
    ({header, body, defaultValue, type, inputProps}: DialogI) => {
      if (isOpen) return Promise.resolve(false);
      if (resolveRef.current) {
        resolveRef.current(false);
      }
      setIsOpen(true);
      setHeader(header);
      setBody(body || "");
      setType(type);
      setInput(defaultValue || "");
      setInputProps(inputProps || null);
      return new Promise<boolean | string>(resolve => {
        resolveRef.current = resolve;
      });
    },
    [isOpen, setIsOpen]
  );

  function close() {
    setIsOpen(false);
    resolveRef.current?.(false);
  }
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
        e.preventDefault();
        if (type === "confirm") {
          resolveRef.current?.(true);
        } else if (type === "prompt") {
          resolveRef.current?.(input);
        } else {
          resolveRef.current?.(false);
        }
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleReturn);
      return () => document.removeEventListener("keydown", handleReturn);
    }
  }, [isOpen, input, type, setIsOpen]);
  const inputEl = React.useRef<HTMLInputElement>(null);
  const okayButton = React.useRef<HTMLButtonElement>(null);
  return (
    <DialogContext.Provider value={openConfirm}>
      {children}
      <Transition show={isOpen} as={React.Fragment}>
        <Dialog
          initialFocus={type === "prompt" ? inputEl : okayButton}
          open={isOpen}
          onClose={() => close()}
          className="theme-container fixed z-10 inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <Transition.Child
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="z-10 alert-dialog bg-gray-900 text-gray-50 rounded max-w-sm w-full mx-auto p-4 shadow-lg">
                <Dialog.Title className="text-2xl mb-2">{header}</Dialog.Title>
                {type === "prompt" ? (
                  <div>
                    <label>
                      {body || ""}
                      <input
                        {...inputProps}
                        ref={inputEl}
                        className="input block w-full mt-4"
                        value={input}
                        onChange={e => setInput(e.currentTarget.value)}
                      />
                    </label>
                  </div>
                ) : (
                  <Dialog.Description>{body}</Dialog.Description>
                )}
                <div className="flex justify-end mt-4 space-x-4">
                  {type !== "alert" && (
                    <Button
                      ref={cancelRef}
                      className="btn btn-error"
                      onClick={close}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    autoFocus={type !== "prompt"}
                    className="btn btn-primary"
                    onClick={() => {
                      resolveRef.current?.(type === "prompt" ? input : true);
                      setIsOpen(false);
                    }}
                    ref={okayButton}
                  >
                    OK
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </DialogContext.Provider>
  );
};

export function useConfirm() {
  const dialog = React.useContext(DialogContext);

  return React.useCallback(
    (input: string | {header: string; body?: string}, bodyInput?: string) => {
      if (typeof input === "string") {
        return dialog({header: input, body: bodyInput, type: "confirm"});
      }
      const {header, body} = input;
      return dialog({header, body, type: "confirm"});
    },
    [dialog]
  );
}
export function usePrompt() {
  const dialog = React.useContext(DialogContext);

  return (
    input:
      | string
      | {
          header: string;
          body?: string;
          defaultValue?: string;
          inputProps?: React.DetailedHTMLProps<
            React.InputHTMLAttributes<HTMLInputElement>,
            HTMLInputElement
          >;
        }
  ) => {
    if (typeof input === "string") {
      return dialog({header: input, type: "prompt"}) as Promise<string>;
    }
    const {header, body, defaultValue, inputProps} = input;
    return dialog({
      header,
      body,
      defaultValue,
      type: "prompt",
      inputProps,
    }) as Promise<string>;
  };
}
export function useAlert() {
  const dialog = React.useContext(DialogContext);
  return ({header, body}: {header: string; body?: string}): Promise<string> =>
    dialog({header, body, type: "alert"}) as Promise<string>;
}

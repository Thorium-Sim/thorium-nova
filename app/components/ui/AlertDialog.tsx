import { popoverTransitionClasses } from "@thorium/ui/Dropdown";
import { cn } from "@thorium/utils/cn";
import * as React from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";

import Button from "./Button";
interface DialogI {
	header: React.ReactNode;
	body?: string;
	defaultValue?: string;
	type: "alert" | "confirm" | "prompt";
	inputProps?: React.DetailedHTMLProps<
		React.InputHTMLAttributes<HTMLInputElement>,
		HTMLInputElement
	>;
}

const DialogContext = React.createContext<
	({ header, body, defaultValue, type, inputProps }: DialogI) => Promise<boolean | string>
>(async () => false);

export const AlertDialog = ({ children }: { children: React.ReactNode }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const [header, setHeader] = React.useState<React.ReactNode>("");
	const [body, setBody] = React.useState("");
	const [type, setType] = React.useState<"alert" | "confirm" | "prompt">("alert");
	const [input, setInput] = React.useState("");
	const [inputProps, setInputProps] = React.useState<React.DetailedHTMLProps<
		React.InputHTMLAttributes<HTMLInputElement>,
		HTMLInputElement
	> | null>(null);
	const cancelRef = React.useRef<HTMLButtonElement>(null);

	const resolveRef = React.useRef<(tf: boolean | string) => void>(undefined);
	const openConfirm = React.useCallback(
		({ header, body, defaultValue, type, inputProps }: DialogI) => {
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
			return new Promise<boolean | string>((resolve) => {
				resolveRef.current = resolve;
			});
		},
		[isOpen],
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
	}, [isOpen, input, type]);
	const inputEl = React.useRef<HTMLInputElement>(null);
	const okayButton = React.useRef<HTMLButtonElement>(null);

	React.useEffect(() => {
		const ref = inputEl.current;
		ref?.focus();
		ref?.select();
	}, []);
	return (
		<DialogContext.Provider value={openConfirm}>
			{children}
			<ModalOverlay
				isOpen={isOpen}
				onOpenChange={(isOpen) => setIsOpen(isOpen)}
				className={cn(
					"fixed inset-0 z-10 overflow-y-auto bg-black/40 flex min-h-full w-full items-center justify-center p-4 backdrop-blur",
					"transition-all duration-200 data-[entering]:opacity-0 data-[exiting]:opacity-0",
				)}
			>
				<Modal className={`theme-container ${popoverTransitionClasses} w-full`}>
					<Dialog
						role="alertdialog"
						className="alert-dialog mx-auto w-full max-w-sm rounded border border-white/20 bg-gray-900 p-4 text-gray-50 shadow-lg"
					>
						{({ close }) => (
							<>
								<Heading slot="title">{header}</Heading>

								{type === "prompt" ? (
									<div>
										<label>
											{body || ""}
											<input
												{...inputProps}
												ref={inputEl}
												className="input mt-4 block w-full"
												autoFocus
												value={input}
												onChange={(e) => setInput(e.currentTarget.value)}
											/>
										</label>
									</div>
								) : (
									<p>{body}</p>
								)}
								<div className="mt-4 flex justify-end space-x-4">
									{type !== "alert" && (
										<Button ref={cancelRef} className="btn btn-error" onClick={close}>
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
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogContext.Provider>

		// <DialogContext.Provider value={openConfirm}>
		// 	{children}
		// 	<Transition show={isOpen} as={React.Fragment}>
		// 		<Dialog
		// 			initialFocus={type === "prompt" ? inputEl : okayButton}
		// 			open={isOpen}
		// 			onClose={() => close()}
		// 			className="theme-container fixed z-10 inset-0 overflow-y-auto"
		// 		>
		// 			<div className="flex items-center justify-center min-h-screen">
		// 				<Transition.Child
		// 					enter="ease-out duration-300"
		// 					enterFrom="opacity-0"
		// 					enterTo="opacity-100"
		// 					leave="ease-in duration-200"
		// 					leaveFrom="opacity-100"
		// 					leaveTo="opacity-0"
		// 				>
		// 					<DialogBackdrop className="fixed inset-0 bg-black opacity-30" />
		// 				</Transition.Child>
		// 				<Transition.Child
		// 					as={React.Fragment}
		// 					enter="ease-out duration-300"
		// 					enterFrom="opacity-0 scale-95"
		// 					enterTo="opacity-100 scale-100"
		// 					leave="ease-in duration-200"
		// 					leaveFrom="opacity-100 scale-100"
		// 					leaveTo="opacity-0 scale-95"
		// 				>
		// 					<div className="z-10 alert-dialog bg-gray-900 text-gray-50 rounded max-w-sm w-full mx-auto p-4 shadow-lg">
		// 						<Dialog.Title className="text-2xl mb-2">{header}</Dialog.Title>

		// 				</Transition.Child>
		// 			</div>
		// 		</Dialog>
		// 	</Transition>
		// </DialogContext.Provider>
	);
};

export function useConfirm() {
	const dialog = React.useContext(DialogContext);

	return React.useCallback(
		(input: string | { header: string; body?: string }, bodyInput?: string) => {
			if (typeof input === "string") {
				return dialog({ header: input, body: bodyInput, type: "confirm" });
			}
			const { header, body } = input;
			return dialog({ header, body, type: "confirm" });
		},
		[dialog],
	);
}
export function usePrompt() {
	const dialog = React.useContext(DialogContext);

	return (
		input:
			| string
			| {
					header: React.ReactNode;
					body?: string;
					defaultValue?: string;
					inputProps?: React.DetailedHTMLProps<
						React.InputHTMLAttributes<HTMLInputElement>,
						HTMLInputElement
					>;
			  },
	) => {
		if (typeof input === "string") {
			return dialog({ header: input, type: "prompt" }) as Promise<string>;
		}
		const { header, body, defaultValue, inputProps } = input;
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
	return ({ header, body }: { header: string; body?: string }): Promise<string> =>
		dialog({ header, body, type: "alert" }) as Promise<string>;
}

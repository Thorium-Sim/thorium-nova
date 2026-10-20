import { Keyboard } from "@thorium/components/Keyboard/index";
import { useState } from "react";

function getActiveElement() {
	if (
		!(document.activeElement instanceof HTMLInputElement) &&
		!(document.activeElement instanceof HTMLTextAreaElement)
	)
		return null;
	return document.activeElement;
}

function getSelection() {
	const activeElement = getActiveElement();
	const value = activeElement?.value || "";
	const defaultSelection = value.length;
	let selectionStart = defaultSelection;
	let selectionEnd = defaultSelection;
	try {
		if (activeElement) {
			selectionStart = activeElement.selectionStart ?? defaultSelection;
			selectionEnd = activeElement.selectionEnd ?? defaultSelection;
		}
	} catch {
		selectionStart = defaultSelection;
		selectionEnd = defaultSelection;
	}
	return { selectionStart, selectionEnd };
}
type InputUpdateParams = {
	activeElement: HTMLInputElement | HTMLTextAreaElement;
	selectionStart: number;
	selectionEnd: number;
};
function backspaceChar({ activeElement, selectionStart, selectionEnd }: InputUpdateParams) {
	const value = activeElement.value as string;

	let nextValue;
	let nextSelectionPosition;
	if (selectionStart === selectionEnd) {
		nextValue = value.substring(0, selectionStart - 1) + value.substring(selectionEnd);
		nextSelectionPosition = selectionStart - 1;
	} else {
		nextValue = value.substring(0, selectionStart) + value.substring(selectionEnd);
		nextSelectionPosition = selectionStart;
	}
	nextSelectionPosition = nextSelectionPosition > 0 ? nextSelectionPosition : 0;
	const inputSet = getValueSetter();

	inputSet?.call(document.activeElement, nextValue);

	return nextSelectionPosition;
}
function deleteChar({ activeElement, selectionStart, selectionEnd }: InputUpdateParams) {
	const value = activeElement.value as string;

	let nextValue;
	let nextSelectionPosition;
	if (selectionStart === selectionEnd) {
		nextValue = value.substring(0, selectionStart) + value.substring(selectionEnd + 1);
		nextSelectionPosition = selectionStart;
	} else {
		nextValue = value.substring(0, selectionStart) + value.substring(selectionEnd);
		nextSelectionPosition = selectionStart;
	}
	nextSelectionPosition = nextSelectionPosition > 0 ? nextSelectionPosition : 0;
	const inputSet = getValueSetter();

	inputSet?.call(document.activeElement, nextValue);

	return nextSelectionPosition;
}

function handleInputUpdate(cb: (params: InputUpdateParams) => number) {
	const activeElement = getActiveElement();
	if (!activeElement) return;
	const selection = getSelection() || { selectionStart: 0, selectionEnd: 0 };
	const { selectionStart, selectionEnd } = selection;

	let nextSelectionPosition = cb({ activeElement, selectionStart, selectionEnd });

	// Queue this for the next task
	setTimeout(() => {
		const activeElement = getActiveElement();
		if (!activeElement) return;
		activeElement.focus();
		try {
			activeElement.setSelectionRange(nextSelectionPosition, nextSelectionPosition);
		} catch (e) {
			console.error(e);
		}
	}, 0);

	activeElement.dispatchEvent(new Event("input", { bubbles: true }));
	activeElement.dispatchEvent(new Event("change", { bubbles: true }));
}

function getValueSetter() {
	const activeElement = getActiveElement();
	if (!activeElement) throw new Error("No active element");
	const nodeName = activeElement.nodeName;
	let nodeElement: keyof typeof window;
	if (nodeName === "INPUT") nodeElement = "HTMLInputElement";
	else if (nodeName === "TEXTAREA") nodeElement = "HTMLTextAreaElement";
	else return;
	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
		window[nodeElement].prototype,
		"value",
	)?.set;
	return nativeInputValueSetter;
}

function insertChar(char: string) {
	return ({ activeElement, selectionEnd, selectionStart }: InputUpdateParams) => {
		const nextValue =
			activeElement.value.substring(0, selectionStart) +
			char +
			activeElement.value.substring(selectionEnd);

		getValueSetter()?.call(document.activeElement, nextValue);

		return selectionStart + char.length;
	};
}

export function TypingKeyboard() {
	const [shifting, setShifting] = useState(false);
	const [capsLock, setCapsLock] = useState(false);
	const [selected, setSelected] = useState<string[]>([]);

	return (
		<Keyboard
			extended="auto"
			shifting={shifting || capsLock}
			selected={[
				...selected,
				...(shifting ? ["ShiftLeft", "ShiftRight"] : []),
				...(capsLock ? ["CapsLock"] : []),
			]}
			onPointerDown={(key, event) => {
				event.preventDefault();
				event.stopPropagation();

				switch (key.keyCode) {
					case "ShiftRight":
					case "ShiftLeft":
						setShifting((s) => !s);
						break;
					case "ControlRight":
					case "ControlLeft":
						setSelected((selected) =>
							selected.includes("ControlRight")
								? selected.filter((c) => !["ControlRight", "ControlLeft"].includes(c))
								: [...selected, "ControlLeft", "ControlRight"],
						);
						break;
					case "AltRight":
					case "AltLeft":
						setSelected((selected) =>
							selected.includes("AltRight")
								? selected.filter((c) => !["AltRight", "AltLeft"].includes(c))
								: [...selected, "AltLeft", "AltRight"],
						);
						break;
					case "MetaRight":
					case "MetaLeft":
						setSelected((selected) =>
							selected.includes("MetaRight")
								? selected.filter((c) => !["MetaRight", "MetaLeft"].includes(c))
								: [...selected, "MetaLeft", "MetaRight"],
						);
						break;
					case "CapsLock":
						setCapsLock((capsLock) => !capsLock);
						break;
					case "Backspace":
						setShifting(false);
						handleInputUpdate(backspaceChar);
						break;
					case "Delete":
						setShifting(false);
						handleInputUpdate(deleteChar);
						break;
					default:
						handleInputUpdate(
							insertChar(
								shifting && key.shiftLabel ? key.shiftLabel : key.char || key.label || key.keyCode,
							),
						);
						setShifting(false);
				}
			}}
			onPointerUp={(key, event) => {
				if (event.pointerType === "touch" && key.keyCode.includes("Shift")) {
					setShifting(false);
				}
			}}
		/>
	);
}

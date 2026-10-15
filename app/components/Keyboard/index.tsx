import { cn } from "@thorium/utils/cn";

import "./Keyboard.css";
import type { PointerEvent } from "react";

type Key = {
	keyCode: string;
	className?: string;
	label?: string;
	shiftLabel?: string;
	char?: string;
	ex?: true;
};
export const keys: Key[] = [
	{
		keyCode: "Escape",
		label: "esc",
		className: "key-escape",
		char: "",
	},
	{ keyCode: "" },
	{ keyCode: "F1" },
	{ keyCode: "F2" },
	{ keyCode: "F3" },
	{ keyCode: "F4" },
	{ keyCode: "", className: "col-span-1" },
	{ keyCode: "F5" },
	{ keyCode: "F6" },
	{ keyCode: "F7" },
	{ keyCode: "F8" },
	{ keyCode: "", className: "col-span-1" },
	{ keyCode: "F9" },
	{ keyCode: "F10" },
	{ keyCode: "F11" },
	{ keyCode: "F12" },
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "F13", ex: true },
	{ keyCode: "F14", ex: true },
	{ keyCode: "F15", ex: true },
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "F16", ex: true },
	{ keyCode: "F17", ex: true },
	{ keyCode: "F18", ex: true },
	{ keyCode: "F19", ex: true },
	{ keyCode: "Backquote", char: "`", shiftLabel: "~" },
	{ keyCode: "Digit1", char: "1", shiftLabel: "!" },
	{ keyCode: "Digit2", char: "2", shiftLabel: "@" },
	{ keyCode: "Digit3", char: "3", shiftLabel: "#" },
	{ keyCode: "Digit4", char: "4", shiftLabel: "$" },
	{ keyCode: "Digit5", char: "5", shiftLabel: "%" },
	{ keyCode: "Digit6", char: "6", shiftLabel: "^" },
	{ keyCode: "Digit7", char: "7", shiftLabel: "&" },
	{ keyCode: "Digit8", char: "8", shiftLabel: "*" },
	{ keyCode: "Digit9", char: "9", shiftLabel: "(" },
	{ keyCode: "Digit0", char: "0", shiftLabel: ")" },
	{ keyCode: "Minus", char: "-", shiftLabel: "_" },
	{ keyCode: "Equal", char: "=", shiftLabel: "+" },
	{
		keyCode: "Backspace",
		label: "backspace",
		className: "col-span-6",
	},
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "Insert", char: "insert", ex: true },
	{ keyCode: "Home", char: "home", ex: true },
	{ keyCode: "PageUp", char: "page up", ex: true },
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "NumLock", char: "num lock", ex: true },
	{ keyCode: "NumpadEqual", char: "=", ex: true },
	{ keyCode: "NumpadDivide", char: "/", ex: true },
	{ keyCode: "NumpadMultiply", char: "*", ex: true },
	{
		keyCode: "Tab",
		label: "tab",
		char: "\t",
		className: "col-span-6",
	},
	{ keyCode: "KeyQ", char: "q", shiftLabel: "Q" },
	{ keyCode: "KeyW", char: "w", shiftLabel: "W" },
	{ keyCode: "KeyE", char: "e", shiftLabel: "E" },
	{ keyCode: "KeyR", char: "r", shiftLabel: "R" },
	{ keyCode: "KeyT", char: "t", shiftLabel: "T" },
	{ keyCode: "KeyY", char: "y", shiftLabel: "Y" },
	{ keyCode: "KeyU", char: "u", shiftLabel: "U" },
	{ keyCode: "KeyI", char: "i", shiftLabel: "I" },
	{ keyCode: "KeyO", char: "o", shiftLabel: "O" },
	{ keyCode: "KeyP", char: "p", shiftLabel: "P" },
	{ keyCode: "BracketLeft", char: "[", shiftLabel: "{" },
	{ keyCode: "BracketRight", char: "]", shiftLabel: "}" },
	{
		keyCode: "Backslash",

		char: "\\",
		shiftLabel: "|",
	},
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "Delete", char: "delete", ex: true },
	{ keyCode: "End", char: "end", ex: true },
	{ keyCode: "PageDown", char: "page down", ex: true },
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "Numpad7", char: "7", ex: true },
	{ keyCode: "Numpad8", char: "8", ex: true },
	{ keyCode: "Numpad9", char: "9", ex: true },
	{ keyCode: "NumpadSubtract", char: "-", ex: true },
	{ keyCode: "CapsLock", label: "caps lock", className: "col-span-7 key-caps" },
	{ keyCode: "KeyA", char: "a", shiftLabel: "A" },
	{ keyCode: "KeyS", char: "s", shiftLabel: "S" },
	{ keyCode: "KeyD", char: "d", shiftLabel: "D" },
	{ keyCode: "KeyF", char: "f", shiftLabel: "F" },
	{ keyCode: "KeyG", char: "g", shiftLabel: "G" },
	{ keyCode: "KeyH", char: "h", shiftLabel: "H" },
	{ keyCode: "KeyJ", char: "j", shiftLabel: "J" },
	{ keyCode: "KeyK", char: "k", shiftLabel: "K" },
	{ keyCode: "KeyL", char: "l", shiftLabel: "L" },
	{ keyCode: "Semicolon", char: ";", shiftLabel: ":" },
	{ keyCode: "Quote", char: "'", shiftLabel: '"' },
	{
		keyCode: "Enter",
		label: "return",
		className: "col-span-7",
		char: "\n",
	},
	{ keyCode: "", className: "col-span-16", ex: true },
	{ keyCode: "Numpad4", char: "4", ex: true },
	{ keyCode: "Numpad5", char: "5", ex: true },
	{ keyCode: "Numpad6", char: "6", ex: true },
	{ keyCode: "NumpadAdd", char: "+", ex: true },
	{
		keyCode: "ShiftLeft",
		label: "shift",
		className: "col-span-9 key-modifier",
	},

	{ keyCode: "KeyZ", char: "z", shiftLabel: "Z" },
	{ keyCode: "KeyX", char: "x", shiftLabel: "X" },
	{ keyCode: "KeyC", char: "c", shiftLabel: "C" },
	{ keyCode: "KeyV", char: "v", shiftLabel: "V" },
	{ keyCode: "KeyB", char: "b", shiftLabel: "B" },
	{ keyCode: "KeyN", char: "n", shiftLabel: "N" },
	{ keyCode: "KeyM", char: "m", shiftLabel: "M" },
	{ keyCode: "Comma", char: ",", shiftLabel: "<" },
	{ keyCode: "Period", char: ".", shiftLabel: ">" },
	{ keyCode: "Slash", char: "/", shiftLabel: "?" },
	{ keyCode: "ShiftRight", label: "shift", className: "col-span-9 key-modifier" },
	{ keyCode: "", className: "col-span-6", ex: true },
	{ keyCode: "ArrowUp", char: "↑", ex: true },
	{ keyCode: "", className: "col-span-6", ex: true },
	{ keyCode: "Numpad1", char: "1", ex: true },
	{ keyCode: "Numpad2", char: "2", ex: true },
	{ keyCode: "Numpad3", char: "3", ex: true },
	{ keyCode: "NumpadEnter", char: "enter", className: "row-span-2", ex: true },
	{
		keyCode: "ControlLeft",
		label: "ctrl",
		className: "col-span-5 key-modifier @max-xl:col-span-7",
	},
	{
		keyCode: "AltLeft",
		label: "alt",
		className: "col-span-5 key-modifier @max-xl:col-span-7",
	},
	{
		keyCode: "MetaLeft",
		label: "meta",
		className: "col-span-5 key-modifier @max-xl:col-span-7",
	},
	{
		keyCode: "Space",
		label: " ",
		char: " ",
		shiftLabel: " ",
		className: "col-span-28 @max-xl:col-span-16",
	},
	{
		keyCode: "MetaRight",
		label: "meta",
		className: "col-span-5 key-modifier @max-xl:col-span-7",
	},
	{
		keyCode: "AltRight",
		label: "alt",
		className: "col-span-5 key-modifier @max-xl:col-span-7",
	},
	{
		keyCode: "ControlRight",
		label: "ctrl",
		className: "col-span-5 key-modifier @max-xl:col-span-7",
	},
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "ArrowLeft", char: "←", ex: true },
	{ keyCode: "ArrowDown", char: "↓", ex: true },
	{ keyCode: "ArrowRight", char: "→", ex: true },
	{ keyCode: "", className: "col-span-2", ex: true },
	{ keyCode: "Numpad0", char: "0", className: "col-span-8", ex: true },
	{ keyCode: "NumpadDecimal", char: ".", ex: true },
];

export function Keyboard({
	extended,
	shifting,
	selected,
	onPointerDown,
	onPointerUp,
}: {
	extended?: boolean | "auto";
	shifting?: boolean;
	selected?: string[];
	onPointerDown?: (key: Key, event: PointerEvent<HTMLButtonElement>) => void;
	onPointerUp?: (key: Key, event: PointerEvent<HTMLButtonElement>) => void;
}) {
	return (
		<div
			className="@container h-full"
			onPointerDown={(event) => {
				event.stopPropagation();
				event.preventDefault();
			}}
		>
			<div
				className={cn("keyboard h-full grid-cols-58", {
					"@min-5xl:grid-cols-90": extended === "auto",
					"grid-cols-90": extended === true,
				})}
			>
				{keys.map((k, i) =>
					!extended && k.ex ? null : (
						<button
							key={`${k.keyCode}${i}`}
							className={cn("keyboard-key", k.className, {
								"@max-5xl:hidden": k.ex && extended === "auto",
								"key-selected": selected?.includes(k.keyCode),
							})}
							onPointerDown={(event) => {
								onPointerDown?.(k, event);
							}}
							onPointerUp={(event) => {
								onPointerUp?.(k, event);
							}}
						>
							{(shifting ? k.shiftLabel : null) ?? k.label ?? k.char ?? k.keyCode}
						</button>
					),
				)}
			</div>
		</div>
	);
}

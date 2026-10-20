import { Keyboard as KeyboardComp, type MetaList } from "@thorium/components/Keyboard";
import { clientId, q } from "@thorium/context/AppContext";
import useEventListener from "@thorium/hooks/useEventListener";
import { getBitmaskFromMeta } from "@thorium/utils/keyboardMetaBitmask";
import { camelCase, capitalCase } from "change-case";
import { useRef, useState } from "react";

export function Keyboard() {
	const [metaKeys, setMetaKeys] = useState<MetaList[]>([]);
	const selected = metaKeys.flatMap((m) =>
		m === "capsLock" ? "CapsLock" : [`${capitalCase(m)}Right`, `${capitalCase(m)}Left`],
	);

	let capsRef = useRef(false);
	useEventListener("keydown", (event: KeyboardEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.repeat) return;
		if (event.code === "CapsLock") {
			capsRef.current = true;
			return;
		}
		switch (event.code) {
			case "ShiftRight":
			case "ShiftLeft":
			case "ControlRight":
			case "ControlLeft":
			case "AltRight":
			case "AltLeft":
			case "MetaRight":
			case "MetaLeft":
				return;
		}
		let metaKeys: MetaList[] = [];
		if (event.shiftKey) metaKeys.push("shift");
		if (event.metaKey) metaKeys.push("meta");
		if (event.altKey) metaKeys.push("alt");
		if (event.ctrlKey) metaKeys.push("control");
		if (capsRef.current) metaKeys.push("capsLock");

		q.keyboard.executeKeyPress.netSend({
			clientId,
			keyId: `${event.code}${metaKeys.length === 0 ? "" : `-${getBitmaskFromMeta(metaKeys)}`}`,
			pressType: "downBlocks",
		});
	});
	useEventListener("keyup", (event: KeyboardEvent) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.repeat) return;
		if (event.code === "CapsLock") {
			capsRef.current = false;
			return;
		}
		let metaKeys: MetaList[] = [];
		if (event.shiftKey) metaKeys.push("shift");
		if (event.metaKey) metaKeys.push("meta");
		if (event.altKey) metaKeys.push("alt");
		if (event.ctrlKey) metaKeys.push("control");
		if (capsRef.current) metaKeys.push("capsLock");
		q.keyboard.executeKeyPress.netSend({
			clientId,
			keyId: `${event.code}${metaKeys.length === 0 ? "" : `-${getBitmaskFromMeta(metaKeys)}`}`,
			pressType: "upBlocks",
		});
	});
	return (
		<div className="grid h-full place-items-center">
			<div className="aspect-5/1 w-full">
				<KeyboardComp
					extended
					selected={selected}
					onPointerDown={(key) => {
						switch (key.keyCode) {
							case "ShiftRight":
							case "ShiftLeft":
							case "ControlRight":
							case "ControlLeft":
							case "AltRight":
							case "AltLeft":
							case "MetaRight":
							case "MetaLeft":
							case "CapsLock":
								const meta = camelCase(
									key.keyCode.replace("Left", "").replace("Right", ""),
								) as MetaList;
								setMetaKeys((m) => (m.includes(meta) ? m.filter((c) => c !== meta) : [...m, meta]));

								break;
							case "":
							case "Escape":
								break;
							default:
								q.keyboard.executeKeyPress.netSend({
									clientId,
									keyId: `${key.keyCode}${metaKeys.length === 0 ? "" : `-${getBitmaskFromMeta(metaKeys)}`}`,
									pressType: "downBlocks",
								});
						}
					}}

					onPointerUp={(key) => {
						switch (key.keyCode) {
							case "ShiftRight":
							case "ShiftLeft":
							case "ControlRight":
							case "ControlLeft":
							case "AltRight":
							case "AltLeft":
							case "MetaRight":
							case "MetaLeft":
							case "CapsLock":
							case "":
							case "Escape":
								break;
							default:
								q.keyboard.executeKeyPress.netSend({
									clientId,
									keyId: `${key.keyCode}${metaKeys.length === 0 ? "" : `-${getBitmaskFromMeta(metaKeys)}`}`,
									pressType: "upBlocks",
								});
								setMetaKeys((m) => m.filter((k) => k !== "capsLock"));
						}
					}}
				/>
			</div>
		</div>
	);
}

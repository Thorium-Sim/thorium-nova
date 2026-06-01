import Button from "@thorium/ui/Button";
import { useRef } from "react";

export function HoldButton({
	holdDelay = 500,
	holdRepeatTime = 100,
	clickAction,
	...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
	holdDelay?: number;
	holdRepeatTime?: number;
	clickAction: (actionCount: number) => void;
}) {
	const abortControllerRef = useRef(new AbortController());
	const holdingRef = useRef(false);
	return (
		<Button
			{...props}
			onPointerDown={() => {
				let actionCount = 1;
				clickAction(actionCount);

				abortControllerRef.current = new AbortController();
				let repeatTimer: ReturnType<typeof setInterval>;

				const delayTimer = setTimeout(() => {
					holdingRef.current = true;
					repeatTimer = setInterval(() => {
						actionCount += 1;
						clickAction(actionCount);
					}, holdRepeatTime);
				}, holdDelay);

				abortControllerRef.current.signal.addEventListener("abort", () => {
					clearTimeout(delayTimer);
					clearInterval(repeatTimer);
				});
			}}
			onPointerUp={() => {
				abortControllerRef.current.abort();
				holdingRef.current = false;
			}}
			onClick={() => {}}
		/>
	);
}

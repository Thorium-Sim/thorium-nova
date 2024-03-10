import { type RefObject, useEffect, useRef } from "react";
import useEventListener from "./useEventListener";

export function useRightClick(
	callback: (e: MouseEvent) => void,
	element?: RefObject<HTMLElement>,
) {
	const mousePosition = useRef<{ x: number; y: number }>();
	const callbackRef = useRef<typeof callback>(() => {});
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);
	useEventListener(
		"pointerdown",
		(e: MouseEvent) => {
			if (e.button === 2) {
				mousePosition.current = { x: e.clientX, y: e.clientY };
			} else {
				mousePosition.current = undefined;
			}
		},
		element?.current || undefined,
	);
	useEventListener(
		"pointerup",
		(e: MouseEvent) => {
			if (!mousePosition.current) return;
			if (
				Math.abs(e.clientX - mousePosition.current.x) < 5 &&
				Math.abs(e.clientY - mousePosition.current.y) < 5
			) {
				callbackRef.current?.(e);
			}
		},
		element?.current || undefined,
	);
}

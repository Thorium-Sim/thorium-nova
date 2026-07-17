import type { ElementProps } from "@thorium/cards/EngineeringPanels/elements/ElementProps";

import "./rotor.css";
import { cn } from "@thorium/utils/cn";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, type RefObject } from "react";
function setRotation(scrollerRef: RefObject<HTMLDivElement | null>, val: number) {
	const scrollPercent = val / 6;
	if (scrollerRef.current) {
		scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight * scrollPercent;
	}
}

export function Rotor({
	max = 6,
	className,
	value,
	update,
}: { max?: number; className?: string } & ElementProps) {
	const abortControllerRef = useRef(new AbortController());
	const scrollerRef = useRef<HTMLDivElement>(null);
	const draggingRef = useRef(false);
	useEffect(() => {
		if (!draggingRef.current) {
			setRotation(scrollerRef, value);
		}
	}, [value]);

	const debouncedUpdate = useCallback(debounce(update, 200), [update]);
	return (
		<div className={cn("rotor-wrapper", className)}>
			<div className="absolute top-0 right-0">{value}</div>
			<div className="rotor-reflection"></div>
			<div className="rotor"></div>
			<div
				className="segments-scroller"
				ref={scrollerRef}
				onPointerDown={(event) => {
					const target = event.currentTarget;
					const pointerId = event.pointerId;
					target.setPointerCapture(pointerId);
					target.style.pointerEvents = "none";
					target.style.scrollSnapType = "none";
					draggingRef.current = true;
					abortControllerRef.current = new AbortController();
					// TODO May 23 2026 — Support more intuitive gestures, like
					// moving the mouse around the circle or dragging left/right
					event.currentTarget.addEventListener(
						"pointermove",
						(moveEvent) => {
							if (moveEvent instanceof PointerEvent) {
								target.scrollTop -= moveEvent.movementY;
								debouncedUpdate(Math.round((target.scrollTop / target.scrollHeight) * 6) + 1);
							}
						},
						{ signal: abortControllerRef.current.signal },
					);

					event.currentTarget.addEventListener(
						"pointerup",
						() => {
							abortControllerRef.current.abort();
							target.releasePointerCapture(pointerId);
							target.style.pointerEvents = "all";
							target.style.scrollSnapType = "y mandatory";
							update(Math.round((target.scrollTop / target.scrollHeight) * 6) + 1);
							draggingRef.current = false;
						},
						{ once: true },
					);
				}}
			>
				{Array.from({ length: max }).map((_, i) => (
					<div key={i} className="segment"></div>
				))}
			</div>
			<div className="rotor-labels">
				{Array.from({ length: max }).map((_, i) => (
					<div key={i} className="rotor-label">
						{i + 1}
					</div>
				))}
			</div>
		</div>
	);
}

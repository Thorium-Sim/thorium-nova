import { useRef } from "react";

import "./rotor.css";
export function Rotor({ max = 6 }: { max?: number }) {
	const abortControllerRef = useRef(new AbortController());
	return (
		<div className="rotor-wrapper">
			<div className="rotor-reflection"></div>
			<div className="rotor"></div>
			<div
				className="segments-scroller"
				onPointerDown={(event) => {
					const target = event.currentTarget;
					const pointerId = event.pointerId;
					target.setPointerCapture(pointerId);
					target.style.pointerEvents = "none";
					target.style.scrollSnapType = "none";

					abortControllerRef.current = new AbortController();
					// TODO May 23 2026 — Support more intuitive gestures, like
					// moving the mouse around the circle or dragging left/right
					event.currentTarget.addEventListener(
						"pointermove",
						(moveEvent) => {
							if (moveEvent instanceof PointerEvent) {
								target.scrollTop -= moveEvent.movementY;
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

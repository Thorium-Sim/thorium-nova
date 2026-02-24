import { useRef } from "react";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";

/**
 * Renders a smoothly-decrementing countdown timer for collision warnings.
 * Uses fixed-width digit spans to prevent layout jitter as digits change.
 */
export function CollisionCountdown({
	timeToCollision,
	baselineTimestamp,
	cardLoaded = true,
}: {
	timeToCollision: number;
	baselineTimestamp: number;
	cardLoaded?: boolean;
}) {
	const spanRef = useRef<HTMLSpanElement>(null);
	const digitSpansRef = useRef<HTMLSpanElement[]>([]);
	const maxDigitWidthRef = useRef(0);
	const initialTtcRef = useRef(timeToCollision);
	const prevBaselineRef = useRef(baselineTimestamp);

	// Reset spans when the server sends a new baseline
	if (baselineTimestamp !== prevBaselineRef.current) {
		prevBaselineRef.current = baselineTimestamp;
		initialTtcRef.current = timeToCollision;
		digitSpansRef.current = [];
	}

	useAnimationFrame(() => {
		const el = spanRef.current;
		if (!el) return;

		// Lazily create fixed-width digit spans on first frame
		if (digitSpansRef.current.length === 0) {
			if (maxDigitWidthRef.current === 0) {
				const parent = el.closest("[style]");
				const fontFamily = parent
					? getComputedStyle(parent).fontFamily
					: '"Battlefield"';
				const fontSize = parent
					? getComputedStyle(parent).fontSize
					: "1.875rem";
				const measurer = document.createElement("span");
				measurer.style.fontFamily = fontFamily;
				measurer.style.fontSize = fontSize;
				measurer.style.position = "absolute";
				measurer.style.visibility = "hidden";
				document.body.appendChild(measurer);
				let maxWidth = 0;
				for (let i = 0; i <= 9; i++) {
					measurer.textContent = String(i);
					maxWidth = Math.max(
						maxWidth,
						measurer.getBoundingClientRect().width,
					);
				}
				document.body.removeChild(measurer);
				maxDigitWidthRef.current = maxWidth;
			}

			const padWidth = initialTtcRef.current.toFixed(1).length;
			const text = `${initialTtcRef.current.toFixed(1).padStart(padWidth, "0")}s`;
			el.textContent = "";
			const spans: HTMLSpanElement[] = [];
			for (const char of text) {
				const span = document.createElement("span");
				span.textContent = char;
				if (char >= "0" && char <= "9") {
					span.style.display = "inline-block";
					span.style.width = `${maxDigitWidthRef.current}px`;
					span.style.textAlign = "center";
				}
				el.appendChild(span);
				spans.push(span);
			}
			digitSpansRef.current = spans;
		}

		const spans = digitSpansRef.current;
		const elapsed = (Date.now() - baselineTimestamp) / 1000;
		const remaining = Math.max(0, timeToCollision - elapsed);
		const padWidth = initialTtcRef.current.toFixed(1).length;
		const text = `${remaining.toFixed(1).padStart(padWidth, "0")}s`;
		for (let i = 0; i < spans.length && i < text.length; i++) {
			if (spans[i].textContent !== text[i]) {
				spans[i].textContent = text[i];
			}
		}
	}, cardLoaded);

	return <span ref={spanRef} />;
}

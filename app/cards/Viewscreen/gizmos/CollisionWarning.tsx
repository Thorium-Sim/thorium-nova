import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import { useEffect, useRef } from "react";
import { useShipWarnings, ShipWarning } from "@thorium/ui/ShipWarning";

export function CollisionWarningGizmo({ className }: { className?: string }) {
	const { cardLoaded } = useCardContext();
	const { shipId } = useStation();
	const [collisionWarning] = q.pilot.collisionWarning.get.useNetRequest({
		shipId,
	});

	const countdownRef = useRef<HTMLSpanElement>(null);
	const baselineRef = useRef({ ttc: 0, timestamp: 0 });
	const initialTtcRef = useRef(0);
	const digitSpansRef = useRef<HTMLSpanElement[]>([]);
	const maxDigitWidthRef = useRef(0);

	const { showWarning, dismissWarning, displayedWarning, fadingOut } = useShipWarnings();

	if (collisionWarning.timeToCollision !== baselineRef.current.ttc) {
		baselineRef.current = { ttc: collisionWarning.timeToCollision, timestamp: Date.now() };
	}

	useEffect(() => {
		if (collisionWarning.objectId !== null) {
			initialTtcRef.current = collisionWarning.timeToCollision;
			digitSpansRef.current = [];
			showWarning({
				id: "collision",
				priority: 10,
				content: <>COLLISION WARNING — {collisionWarning.objectName} — <span ref={countdownRef} /></>,
			});
		} else {
			dismissWarning("collision");
			digitSpansRef.current = [];
		}
	}, [collisionWarning.objectId, showWarning, dismissWarning]);

	useAnimationFrame(() => {
		const el = countdownRef.current;
		if (!el || collisionWarning.objectId === null) return;

		if (digitSpansRef.current.length === 0) {
			if (maxDigitWidthRef.current === 0) {
				const parent = el.closest("[style]");
				const fontFamily = parent ? getComputedStyle(parent).fontFamily : '"Battlefield"';
				const fontSize = parent ? getComputedStyle(parent).fontSize : "1.875rem";
				const measurer = document.createElement("span");
				measurer.style.fontFamily = fontFamily;
				measurer.style.fontSize = fontSize;
				measurer.style.position = "absolute";
				measurer.style.visibility = "hidden";
				document.body.appendChild(measurer);
				let maxWidth = 0;
				for (let i = 0; i <= 9; i++) {
					measurer.textContent = String(i);
					maxWidth = Math.max(maxWidth, measurer.getBoundingClientRect().width);
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
		const elapsed = (Date.now() - baselineRef.current.timestamp) / 1000;
		const remaining = Math.max(0, baselineRef.current.ttc - elapsed);
		const padWidth = initialTtcRef.current.toFixed(1).length;
		const text = `${remaining.toFixed(1).padStart(padWidth, "0")}s`;
		for (let i = 0; i < spans.length && i < text.length; i++) {
			if (spans[i].textContent !== text[i]) {
				spans[i].textContent = text[i];
			}
		}
	}, cardLoaded);

	return (
		<ShipWarning
			warning={displayedWarning}
			fadingOut={fadingOut}
			mode="inline"
			className={className}
		/>
	);
}

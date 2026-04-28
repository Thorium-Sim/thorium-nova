import { COLLISION_WARNING_SECONDS } from "@thorium/ecs-components/shipAlerts";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useRef } from "react";

/** Pad width derived from the max warning duration so the display never shifts. */
const PAD_WIDTH = COLLISION_WARNING_SECONDS.toFixed(1).length;

/**
 * Renders a smoothly-decrementing countdown timer for collision warnings.
 * Relies on the parent's `tabular-nums` CSS to keep digits fixed-width.
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

	useAnimationFrame(() => {
		const el = spanRef.current;
		if (!el) return;

		const elapsed = (Date.now() - baselineTimestamp) / 1000;
		const remaining = Math.max(0, timeToCollision - elapsed);
		el.textContent = `${remaining.toFixed(1).padStart(PAD_WIDTH, "0")}s`;
	}, cardLoaded);

	return <span ref={spanRef} />;
}

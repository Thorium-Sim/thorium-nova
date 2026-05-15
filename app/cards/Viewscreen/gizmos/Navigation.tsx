import { formatSpeed, useForwardVelocity } from "@thorium/cards/Pilot/ImpulseControls";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";
import { useRef } from "react";

export function NavigationGizmo({ className }: { className?: string }) {
	const { cardLoaded } = useCardContext();
	const { shipId } = useStation();
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });

	const forwardRef = useRef<HTMLDivElement>(null);

	const getForwardVelocity = useForwardVelocity();

	useAnimationFrame(() => {
		const [forwardVelocity] = getForwardVelocity();
		if (forwardRef.current) {
			forwardRef.current.textContent = formatSpeed(forwardVelocity);
		}
	}, cardLoaded);

	return (
		<div className={cn("flex flex-col items-start text-left text-base", className)}>
			{autopilot.destinationName ? <div>Destination: {autopilot.destinationName}</div> : null}
			<div className="tabular-nums" ref={forwardRef} />
		</div>
	);
}

import type { ElementProps } from "@thorium/cards/EngineeringPanels/elements/ElementProps";

import "./pushButton.css";
import { cn } from "@thorium/utils/cn";
import { useEffect } from "react";
export function PushButton({
	color = "red",
	className,
	update,
}: { color?: string; className?: string } & ElementProps) {
	useEffect(() => {
		return () => {
			update(0);
		};
	}, [update]);
	return (
		<div
			className={cn("push-button cursor-pointer", className)}
			onPointerDown={() => update(1)}
			onPointerUp={() => update(0)}
			style={
				// @ts-expect-error
				{ "--color": color }
			}
		/>
	);
}

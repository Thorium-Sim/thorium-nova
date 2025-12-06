import useInterval from "@thorium/hooks/useInterval";
import { cn } from "@thorium/utils/cn";
import { now } from "dot-beat-time";
import { useRef } from "react";

export function StardateGizmo(
	props: Omit<
		React.DetailedHTMLProps<
			React.HTMLAttributes<HTMLSpanElement>,
			HTMLSpanElement
		>,
		"children"
	>,
) {
	const ref = useRef<HTMLSpanElement>(null);
	useInterval(() => {
		if (ref.current) {
			ref.current.textContent = now();
		}
	}, 5000);

	return (
		<span
			ref={ref}
			{...props}
			className={cn(
				"gizmo-stardate text-base tabular-nums font-mono",
				props.className,
			)}
		>
			{now()}
		</span>
	);
}

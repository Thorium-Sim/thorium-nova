import { ShieldView } from "@thorium/cards/Targeting/Shields";
import { cn } from "@thorium/utils/cn";

export function ShieldsGizmo({ className }: { className: string }) {
	return (
		<div className={cn("gizmo-shields", className)}>
			<ShieldView />
		</div>
	);
}

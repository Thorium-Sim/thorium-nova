import { q } from "@thorium/context/AppContext";
import { cn } from "@thorium/utils/cn";
import { useState } from "react";

export function DamageOverlay({
	systemId,
	className,
}: { systemId: number; className?: string }) {
	const [reason, setReason] = useState("");
	const [system] = q.legacy.powerDistribution.systemPower.useNetRequest(
		{
			systemId,
		},
		{
			callback(system) {
				setReason((reason) =>
					system.offline
						? "System Damaged"
						: typeof system.currentPower === "number" &&
								Array.isArray(system.powerLevels) &&
								system.currentPower < system.powerLevels[0]
							? "Insufficient Power"
							: reason,
				);
			},
		},
	);

	const disabled =
		system.offline ||
		(typeof system.currentPower === "number" &&
			Array.isArray(system.powerLevels) &&
			system.currentPower < system.powerLevels[0]);

	return (
		<div
			className={cn(
				"transition-all duration-700 opacity-0 pointer-events-none absolute inset-0 bg-black/50 rounded ring-white/50 ring-1 p-4 flex flex-col items-center justify-center gap-4 z-30",
				className,
				{
					"backdrop-blur-0": !disabled,
					"opacity-100 pointer-events-auto backdrop-blur": disabled,
				},
			)}
		>
			<p className="text-red-500 font-bold text-3xl">{system.name} Offline</p>
			<p className="text-red-500 font-bold text-xl">{reason}</p>
		</div>
	);
}

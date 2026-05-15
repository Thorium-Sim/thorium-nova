import { q } from "@thorium/context/AppContext";
import type { isShip } from "@thorium/ecs-components/isShip";
import { useStation } from "@thorium/routes/station/useStation";
import { cn } from "@thorium/utils/cn";
import * as React from "react";
import type z from "zod";

// TODO March 18, 2026 - When we have internal crew and determine what all of these do, turn them into flags and make it so ships can be configured with fewer alert conditions and customizable colors and descriptions.
type AlertLevelT = z.infer<typeof isShip>["alertLevel"];
const alertLevelText = [
	{
		label: "Alert Condition 5",
		number: "5",
		text: "Used when the ship is at normal running status. The crew is on standard duty and the ship is in no danger.",
		color: "oklch(72.3% 0.219 149.579)",
	},
	{
		label: "Alert Condition 4",
		number: "4",
		text: "Used when the ship has a minor problem. All crew except damage control is on standard duty.",
		color: "oklch(89.7% 0.196 126.665)",
	},
	{
		label: "Alert Condition 3",
		number: "3",
		text: "Used when the ship needs to be ready for a dangerous situation. All off duty personnel are put on stand by status.",
		color: "oklch(85.2% 0.199 91.936)",
	},
	{
		label: "Alert Condition 2",
		number: "2",
		text: "Used when the ship is in a dangerous situation, but is safe for the moment. All crew members are put on duty.",
		color: "oklch(75% 0.183 55.934)",
	},
	{
		label: "Alert Condition 1",
		number: "1",
		text: "Used when the ship is in danger or under attack. All crew members are put on duty at battle stations.",
		color: "oklch(63.7% 0.237 25.331)",
	},
] as const;

export function AlertLevel() {
	const {
		shipId,
		ship: { alertLevel },
	} = useStation();

	const updateLevel = (newLevel: AlertLevelT) => {
		q.alertLevel.update.netSend({
			alertLevel: newLevel,
			shipId,
		});
	};

	return (
		<ul className="mx-auto flex h-full max-w-3xl cursor-pointer flex-col items-center justify-around gap-4">
			{alertLevelText.map((a) => (
				<li
					key={a.number}
					className={cn(
						"border border-white/50 bg-black/50 p-4 w-full hover:bg-(--alert-bg-color)/20 transition-colors",
						{ "bg-(--alert-bg-color)/50": alertLevel === a.number },
					)}
					onClick={() => updateLevel(a.number)}
					style={{
						// @ts-expect-error
						"--alert-bg-color": a.color,
					}}
				>
					<div className="text-xl font-bold lg:text-3xl">{a.label}</div>
					<div className="text-base text-balance lg:text-lg">{a.text}</div>
				</li>
			))}
		</ul>
	);
}

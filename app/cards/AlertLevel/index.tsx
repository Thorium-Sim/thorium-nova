import * as React from "react";
import { q } from "@thorium/context/AppContext";
import Button from "@thorium/ui/Button";
import type { isShip } from "@thorium/ecs-components/isShip";
import { useStation } from "@thorium/routes/station/useStation";
import type z from "zod";

type AlertLevelT = z.infer<typeof isShip>["alertLevel"];
const alertLevelText = [
	{
		number: 5,
		text: "This alert condition is used when the ship is at normal running status. The crew is on standard duty and the ship is in no danger.",
	},
	{
		number: 4,
		text: "This alert condition is used when the ship has a minor problem. All crew except damage control is on standard duty.",
	},
	{
		number: 3,
		text: "This alert condition is used when the ship needs to be ready for a dangerous situation. All off duty personnel are put on stand by status.",
	},
	{
		number: 2,
		text: "This alert condition is used when the ship is in a dangerous situation, but is safe for the moment. All crew members are put on duty.",
	},
	{
		number: 1,
		text: "This alert condition is used when the ship is in danger or under attack. All crew members are put on duty at battle stations.",
	},
];

export function AlertLevel() {
	const [description, setDescription] = React.useState("");
	const { shipId } = useStation();

	const updateLevel = (newLevel: AlertLevelT) => {
		q.alertLevel.update.netSend({
			alertLevel: newLevel,
			shipId,
		});
	};
	const displayDesc = (level: number) => {
		alertLevelText.forEach((e) => {
			if (e.number === level) {
				setDescription(e.text);
			}
		});
	};
	const clearDesc = () => {
		setDescription("");
	};
	return (
		<ul className="flex flex-col justify-between h-full gap-4">
			<li
				className="text-5xl font-bold text-green-500 w-fit"
				onClick={() => updateLevel("5")}
				onMouseEnter={() => displayDesc(5)}
				onMouseLeave={() => clearDesc()}
			>
				Alert Condition 5
			</li>
			<li
				className="text-5xl font-bold text-lime-300 w-fit"
				onClick={() => updateLevel("4")}
				onMouseEnter={() => displayDesc(4)}
				onMouseLeave={() => clearDesc()}
			>
				Alert Condition 4
			</li>
			<li
				className="text-5xl font-bold text-yellow-400 w-fit"
				onClick={() => updateLevel("3")}
				onMouseEnter={() => displayDesc(3)}
				onMouseLeave={() => clearDesc()}
			>
				Alert Condition 3
			</li>
			<li
				className="text-5xl font-bold text-orange-400 w-fit"
				onClick={() => updateLevel("2")}
				onMouseEnter={() => displayDesc(2)}
				onMouseLeave={() => clearDesc()}
			>
				Alert Condition 2
			</li>
			<li
				className="text-5xl font-bold text-red-500 w-fit"
				onClick={() => updateLevel("1")}
				onMouseEnter={() => displayDesc(1)}
				onMouseLeave={() => clearDesc()}
			>
				Alert Condition 1
			</li>
			<div className="panel p-4 text-3xl w-1/2 h-48">{description}</div>
		</ul>
	);
}

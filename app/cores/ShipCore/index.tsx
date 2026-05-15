import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Input from "@thorium/ui/Input";
import { cn } from "@thorium/utils/cn";

export function ShipCore() {
	const { ship, shipId } = useStation();
	const currentAlertLevel = ship.alertLevel || ("5" as const);

	return (
		<>
			<Input label="Name" className="input-xs" defaultValue={ship.name} />
			<Input label="Class" className="input-xs" defaultValue={ship.shipClass} />

			<Input label="Registry" className="input-xs" defaultValue={ship.registry} />
			<span>Alert Level</span>
			<div className="flex gap-1">
				<AlertLevelButton
					alertLevel="1"
					color="bg-error"
					currentLevel={currentAlertLevel}
					shipId={shipId}
				/>
				<AlertLevelButton
					alertLevel="2"
					color="bg-warning"
					currentLevel={currentAlertLevel}
					shipId={shipId}
				/>
				<AlertLevelButton
					alertLevel="3"
					color="bg-yellow-600"
					currentLevel={currentAlertLevel}
					shipId={shipId}
				/>
				<AlertLevelButton
					alertLevel="4"
					color="bg-lime-600"
					currentLevel={currentAlertLevel}
					shipId={shipId}
				/>
				<AlertLevelButton
					alertLevel="5"
					color="bg-green-600"
					currentLevel={currentAlertLevel}
					shipId={shipId}
				/>
			</div>
			<Input label="Category" className="input-xs" defaultValue={ship.category} />
		</>
	);
}

function AlertLevelButton({
	color,
	currentLevel,
	alertLevel,
	shipId,
}: {
	color: string;
	currentLevel: string;
	alertLevel: "5" | "4" | "3" | "2" | "1" | "p";
	shipId: number;
}) {
	return (
		<button
			className={cn("aspect-square w-6 rounded brightness-75", color, {
				"brightness-125": currentLevel === alertLevel,
			})}
			onClick={() => {
				q.alertLevel.update.netSend({
					shipId,
					alertLevel,
				});
			}}
		>
			{alertLevel}
		</button>
	);
}

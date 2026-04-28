import { q } from "@thorium/context/AppContext";
import type { Kelvin } from "@thorium/utils/unitTypes";

import { cargoSort } from "./cargoSort";

export function CargoList({
	selectedRoom,
	enRouteContainer,
	selectedContainerId,
	onClick,
}: {
	selectedRoom:
		| {
				id: number;
				contents: {
					[inventoryTemplateName: string]: {
						temperature: Kelvin;
						count: number;
					};
				};
		  }
		| undefined;
	enRouteContainer: { id: number; entityState: "idle" | "enRoute" } | undefined;
	selectedContainerId: number | null;
	onClick: (key: string) => Promise<void>;
}) {
	const [inventoryTypes] = q.cargoControl.inventoryTypes.useNetRequest();
	return (
		<ul className="panel panel-primary flex-1 overflow-y-auto">
			{selectedRoom &&
				Object.entries(selectedRoom.contents)
					.sort(cargoSort)
					.map(([key, value]) => {
						if (value.count === 0) return null;
						const inventoryType = inventoryTypes[key];
						const itemVolume = Math.max(Math.round(inventoryType.volume * 1000) / 1000, 0.0001);

						return (
							<li
								key={key}
								className={`pointer-events-auto block w-full border border-solid border-white/50 bg-black px-4 py-2 select-none ${
									enRouteContainer?.id === selectedContainerId &&
									enRouteContainer?.entityState === "idle"
										? "cursor-pointer hover:bg-black/50 active:bg-white/20"
										: "cursor-not-allowed"
								}`}
								onClick={() => onClick(key)}
							>
								<div className="flex flex-wrap justify-between">
									<span className="font-bold">
										{key} {inventoryType ? `(${itemVolume} / unit)` : ""}
									</span>
									<span className="tabular-nums">{value.count}</span>
								</div>
							</li>
						);
					})}
		</ul>
	);
}

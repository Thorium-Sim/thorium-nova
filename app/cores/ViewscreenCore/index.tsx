import { q } from "@thorium/context/AppContext";
import { useState } from "react";

const brokenModeLabels: Record<string, string> = {
	fullyBroken: "Fully Breakable",
	cameraBrokenOnly: "Only Camera Breakable",
	invincible: "Invincible",
};

export function ViewscreenCore() {
	const [playerShips] = q.ship.players.useNetRequest();
	const [selectedShipId, setSelectedShipId] = useState<number | null>(null);

	const shipId = selectedShipId ?? playerShips[0]?.id ?? null;

	return (
		<div className="flex flex-col gap-2 p-2 text-sm">
			{playerShips.length > 1 && (
				<select
					className="select select-xs bg-gray-800 text-white"
					value={shipId ?? ""}
					onChange={(e) => setSelectedShipId(Number(e.target.value))}
				>
					{playerShips.map((ship) => (
						<option key={ship.id} value={ship.id}>
							{ship.name}
						</option>
					))}
				</select>
			)}
			{shipId !== null ? (
				<ViewscreenList shipId={shipId} />
			) : (
				<p className="text-gray-400">No ships available</p>
			)}
		</div>
	);
}

function ViewscreenList({ shipId }: { shipId: number }) {
	const [data] = q.viewscreen.allViewscreens.useNetRequest({ shipId });

	const viewscreens = data?.viewscreens;
	const viewscreenSystemOffline = data?.viewscreenSystemOffline ?? false;

	if (!viewscreens || viewscreens.length === 0) {
		return <p className="text-gray-400">No viewscreens on this ship</p>;
	}

	const allOffline = viewscreens.every((vs) => vs.camerasOffline);
	const someOffline = viewscreens.some((vs) => vs.camerasOffline);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-1 border-b border-white/10 pb-1">
				<label className="flex items-center gap-2 text-xs font-medium">
					<input
						type="checkbox"
						checked={allOffline}
						ref={(el) => {
							if (el) el.indeterminate = someOffline && !allOffline;
						}}
						onChange={(e) =>
							q.viewscreen.setAllCamerasOffline.netSend({
								shipId,
								camerasOffline: e.target.checked,
							})
						}
					/>
					All Viewscreen Cameras Offline
				</label>
				<label className="flex items-center gap-2 text-xs font-medium text-yellow-400/80">
					<input
						type="checkbox"
						checked={viewscreenSystemOffline}
						onChange={(e) =>
							q.viewscreen.simulateDamage.netSend({
								shipId,
								offline: e.target.checked,
							})
						}
					/>
					Simulate Damage
				</label>
			</div>
			<div className="flex flex-col gap-1">
				{viewscreens.map((vs) => (
					<div
						key={vs.entityId}
						className="flex flex-col bg-gray-800/50 rounded px-2 py-1 gap-1"
					>
						<div className="flex items-center justify-between">
							<div className="flex flex-col">
								<span className="text-white">{vs.name}</span>
								<span className="text-gray-400 text-xs">
									{brokenModeLabels[vs.brokenMode] ?? vs.brokenMode}
									{vs.damageBroken && (
										<span className="text-red-400 ml-1">Damaged</span>
									)}
								</span>
							</div>
							<label className="flex items-center gap-1 text-xs">
								<input
									type="checkbox"
									checked={vs.camerasOffline}
									onChange={(e) =>
										q.viewscreen.setCamerasOffline.netSend({
											entityId: vs.entityId,
											camerasOffline: e.target.checked,
										})
									}
								/>
								Viewscreen Camera Offline
							</label>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

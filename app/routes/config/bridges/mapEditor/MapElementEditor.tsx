import type {
	BridgeMapElement,
	BridgeViewscreen,
} from "@thorium/.server/classes/Plugins/Bridge";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import Button from "@thorium/ui/Button";
import { q } from "@thorium/context/AppContext";
import { href as iconsHref } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";

export function MapElementEditor({
	element,
	pluginId,
	bridgeId,
	levelId,
	viewscreens,
	stationNames,
	assignedStations,
	onDelete,
}: {
	element: BridgeMapElement;
	pluginId: string;
	bridgeId: string;
	levelId: string;
	viewscreens: BridgeViewscreen[];
	stationNames: string[];
	assignedStations: Set<string>;
	onDelete: () => void;
}) {
	function update(params: Record<string, any>) {
		q.plugin.bridge.updateElement.netSend({
			pluginId,
			bridgeId,
			levelId,
			elementId: element.id,
			...params,
		});
	}

	// Find linked viewscreen for viewscreen elements
	const linkedViewscreen = element.type === "viewscreen" && element.viewscreenId
		? viewscreens.find((v) => v.id === element.viewscreenId)
		: null;

	const headerLabel = element.type === "station" ? "Client" : "Viewscreen";

	return (
		<div className="absolute top-2 right-2 bg-gray-900/95 border border-white/20 rounded p-3 flex flex-col gap-2 w-56 text-sm z-10 max-h-[calc(100%-1rem)] overflow-y-auto">
			<div className="font-medium text-white">{headerLabel}</div>
			{/* Inline viewscreen editing */}
			{element.type === "viewscreen" && linkedViewscreen && (
				<>
					<Input
						labelHidden={false}
						label="Name"
						defaultValue={linkedViewscreen.name}
						onBlur={(e: any) => {
							const newName = e.target.value.trim();
							if (!newName || newName === linkedViewscreen.name) {
								e.target.value = linkedViewscreen.name;
								return;
							}
							const isDuplicate = viewscreens.some(
								(v) => v.id !== linkedViewscreen.id && v.name === newName,
							);
							if (isDuplicate) {
								e.target.value = linkedViewscreen.name;
								return;
							}
							q.plugin.bridge.updateViewscreen.netSend({
								pluginId,
								bridgeId,
								viewscreenId: linkedViewscreen.id,
								name: newName,
							});
						}}
						onKeyDown={(e: any) => { if (e.key === "Enter") e.target.blur(); }}
					/>
					<label className="flex flex-col gap-1 text-xs">
						<span className="text-gray-300">Default Yaw Angle: {((((element.rotation % 360) + 540) % 360) - 180).toFixed(0)}°</span>
						<input
							type="range"
							min={-180}
							max={180}
							value={((((element.rotation % 360) + 540) % 360) - 180)}
							onChange={(e) => update({ rotation: Number(e.target.value) })}
						/>
					</label>
					<div className="flex flex-col gap-1 text-xs">
						<span className="text-gray-300">Default Camera Pitch Angle: {(element.pitch ?? 0)}°</span>
						<div className="flex items-center gap-2">
							<input
								type="range"
								min={-180}
								max={180}
								value={element.pitch ?? 0}
								onChange={(e) => update({ pitch: Number(e.target.value) })}
								className="flex-1"
							/>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="#c084fc"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{ transform: `rotate(${-(element.pitch ?? 0)}deg)`, flexShrink: 0 }}
							>
								<use href={`${iconsHref}#video`} />
							</svg>
						</div>
					</div>
					<label className="flex flex-col gap-1 text-xs">
						<span className="text-gray-300">Camera FOV: {linkedViewscreen.fov ?? 45}°</span>
						<input
							type="range"
							min={10}
							max={80}
							value={linkedViewscreen.fov ?? 45}
							onChange={(e) =>
								q.plugin.bridge.updateViewscreen.netSend({
									pluginId,
									bridgeId,
									viewscreenId: linkedViewscreen.id,
									fov: Number(e.target.value),
								})
							}
						/>
					</label>
					<label className="flex items-center gap-2 text-xs">
						<input
							type="checkbox"
							checked={linkedViewscreen.isMainViewscreen ?? false}
							disabled={!linkedViewscreen.isMainViewscreen && viewscreens.some(v => v.id !== linkedViewscreen.id && v.isMainViewscreen)}
							onChange={(e) =>
								q.plugin.bridge.updateViewscreen.netSend({
									pluginId,
									bridgeId,
									viewscreenId: linkedViewscreen.id,
									isMainViewscreen: e.target.checked,
								})
							}
						/>
						Is Main Viewscreen?
					</label>
					<label className="flex items-center gap-2 text-xs">
						<input
							type="checkbox"
							checked={linkedViewscreen.showGizmos ?? true}
							onChange={(e) =>
								q.plugin.bridge.updateViewscreen.netSend({
									pluginId,
									bridgeId,
									viewscreenId: linkedViewscreen.id,
									showGizmos: e.target.checked,
								})
							}
						/>
						Show Gizmos
					</label>
					<label className="flex items-center gap-2 text-xs">
						<input
							type="checkbox"
							checked={linkedViewscreen.showLayout ?? true}
							onChange={(e) =>
								q.plugin.bridge.updateViewscreen.netSend({
									pluginId,
									bridgeId,
									viewscreenId: linkedViewscreen.id,
									showLayout: e.target.checked,
								})
							}
						/>
						Show Layout
					</label>
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1">
							<span className="text-xs text-gray-300">Broken Settings</span>
							<Tooltip
								content={
									<div className="text-xs max-w-48 space-y-1">
										<p><strong>Fully Broken:</strong> No cameras, no gizmos, no displays when offline.</p>
										<p><strong>Camera Broken Only:</strong> Cameras go offline but gizmos and displays still work.</p>
										<p><strong>Invincible:</strong> Cannot be broken by in-game damage events.</p>
									</div>
								}
								placement="left"
							>
								<svg
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-gray-400 cursor-help"
								>
									<use href={`${iconsHref}#info`} />
								</svg>
							</Tooltip>
						</div>
						<Select
							label="Broken Settings"
							labelHidden
							items={[
								{ id: "fullyBroken", label: "Fully Broken" },
								{ id: "cameraBrokenOnly", label: "Camera Broken Only" },
								{ id: "invincible", label: "Invincible" },
							]}
							selected={linkedViewscreen.brokenMode ?? "fullyBroken"}
							setSelected={(val) =>
								q.plugin.bridge.updateViewscreen.netSend({
									pluginId,
									bridgeId,
									viewscreenId: linkedViewscreen.id,
									brokenMode: val as "fullyBroken" | "cameraBrokenOnly" | "invincible",
								})
							}
						/>
					</div>
					<Input
						labelHidden={false}
						label="Client Name"
						defaultValue={element.clientName ?? ""}
						onBlur={(e: any) => {
							update({ clientName: e.target.value.trim() });
						}}
						onKeyDown={(e: any) => { if (e.key === "Enter") e.target.blur(); }}
					/>
				</>
			)}
			{/* Station element: station name dropdown + client assignment */}
			{element.type === "station" && (
				<>
					<hr className="border-white/10" />
					<Select
						label="Station"
						items={[
							{ id: "__none__", label: "None" },
							...stationNames.map((name) => ({
								id: name,
								label: name,
								disabled: name !== element.stationName && assignedStations.has(name),
							})),
						]}
						selected={element.stationName ?? "__none__"}
						setSelected={(val) =>
							update({
								stationName: val === "__none__" ? "" : val,
							})
						}
					/>
					<Input
						labelHidden={false}
						label="Client Name"
						defaultValue={element.clientName ?? ""}
						onBlur={(e: any) => {
							update({ clientName: e.target.value.trim() });
						}}
						onKeyDown={(e: any) => { if (e.key === "Enter") e.target.blur(); }}
					/>
					</>
			)}
			<Button className="btn-error btn-xs w-full" onClick={onDelete}>
				{element.type === "station" ? "Delete Client" : "Delete Viewscreen"}
			</Button>
		</div>
	);
}

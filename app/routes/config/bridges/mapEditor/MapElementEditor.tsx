import type {
	BridgeMapElement,
	BridgeViewscreen,
} from "@thorium/.server/classes/Plugins/Bridge";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import Button from "@thorium/ui/Button";
import { q } from "@thorium/context/AppContext";
import { Icon } from "@thorium/ui/Icon";
import InfoTip from "@thorium/ui/InfoTip";
import Checkbox from "@thorium/ui/Checkbox";

export function MapElementEditor({
	element,
	pluginId,
	bridgeId,
	floorId,
	viewscreens,
	stationNames,
	assignedStations,
	elementScale,
	onDelete,
}: {
	element: BridgeMapElement;
	pluginId: string;
	bridgeId: string;
	floorId: string;
	viewscreens: BridgeViewscreen[];
	stationNames: string[];
	assignedStations: Set<string>;
	elementScale: number;
	onDelete: () => void;
}) {
	function update(params: Record<string, any>) {
		q.plugin.bridge.updateElement.netSend({
			pluginId,
			bridgeId,
			floorId,
			elementId: element.id,
			...params,
		});
	}

	// Find linked viewscreen for viewscreen elements
	const linkedViewscreen =
		element.type === "viewscreen" && element.viewscreenId
			? viewscreens.find((v) => v.id === element.viewscreenId)
			: null;

	const headerLabel = element.type === "station" ? "Client" : "Viewscreen";

	return (
		<div className="absolute top-2 right-2 bg-gray-900/95 border border-white/20 rounded p-3 flex flex-col gap-2 w-64 text-sm z-10 max-h-[calc(100%-1rem)] overflow-y-auto">
			<div className="font-medium text-white">{headerLabel}</div>
			{/* Inline viewscreen editing */}
			{element.type === "viewscreen" && linkedViewscreen && (
				<>
					<Input
						labelHidden={false}
						label={<>Name <InfoTip>The name of the viewscreen in the flight lobby.</InfoTip></>}
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
						onKeyDown={(e: any) => {
							if (e.key === "Enter") e.target.blur();
						}}
					/>
					<div className="flex flex-col gap-1 text-xs">
						<span className="text-gray-300">
							Default Yaw Angle:{" "}
							{((((element.rotation % 360) + 540) % 360) - 180).toFixed(0)}°
						</span>
						<div className="flex items-center gap-2">
							<input
								type="range"
								min={-180}
								max={180}
								value={(((element.rotation % 360) + 540) % 360) - 180}
								onChange={(e) =>
									update({ rotation: Number(e.target.value) })
								}
								className="flex-1"
							/>
							<input
								key={`yaw-${Math.round((((element.rotation % 360) + 540) % 360) - 180)}`}
								type="number"
								min={-180}
								max={180}
								defaultValue={Math.round(
									(((element.rotation % 360) + 540) % 360) - 180,
								)}
								onKeyDown={(e: any) => {
									if (e.key === "Enter") {
										const val = Number(e.target.value);
										if (Number.isFinite(val)) {
											update({ rotation: val });
										}
									}
								}}
								onBlur={(e: any) => {
									e.target.value = Math.round(
										(((element.rotation % 360) + 540) % 360) - 180,
									);
								}}
								className="w-14 bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1 text-xs">
						<span className="text-gray-300">
							Default Camera Pitch Angle: {element.pitch ?? 0}°
						</span>
						<div className="flex items-center gap-2">
							<input
								type="range"
								min={-180}
								max={180}
								value={element.pitch ?? 0}
								onChange={(e) => update({ pitch: Number(e.target.value) })}
								className="flex-1"
							/>
							<input
								key={`pitch-${element.pitch ?? 0}`}
								type="number"
								min={-180}
								max={180}
								defaultValue={element.pitch ?? 0}
								onKeyDown={(e: any) => {
									if (e.key === "Enter") {
										const val = Number(e.target.value);
										if (Number.isFinite(val)) {
											update({ pitch: val });
										}
									}
								}}
								onBlur={(e: any) => {
									e.target.value = element.pitch ?? 0;
								}}
								className="w-14 bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white"
							/>
							<Icon
								name="video"
								size="lg"
								fill="none"
								stroke="#c084fc"
								strokeWidth={2}
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{
									transform: `rotate(${-(element.pitch ?? 0)}deg)`,
									flexShrink: 0,
								}}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1 text-xs">
						<span className="text-gray-300">
							Camera FOV: {linkedViewscreen.fov ?? 45}°
						</span>
						<div className="flex items-center gap-2">
							<input
								type="range"
								min={1}
								max={179}
								value={linkedViewscreen.fov ?? 45}
								onChange={(e) =>
									q.plugin.bridge.updateViewscreen.netSend({
										pluginId,
										bridgeId,
										viewscreenId: linkedViewscreen.id,
										fov: Number(e.target.value),
									})
								}
								className="flex-1"
							/>
							<input
								key={`fov-${linkedViewscreen.fov ?? 45}`}
								type="number"
								min={1}
								max={179}
								defaultValue={linkedViewscreen.fov ?? 45}
								onKeyDown={(e: any) => {
									if (e.key === "Enter") {
										const val = Number(e.target.value);
										if (val >= 1 && val <= 179) {
											q.plugin.bridge.updateViewscreen.netSend({
												pluginId,
												bridgeId,
												viewscreenId: linkedViewscreen.id,
												fov: val,
											});
										}
									}
								}}
								onBlur={(e: any) => {
									e.target.value = linkedViewscreen.fov ?? 45;
								}}
								className="w-14 bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white"
							/>
						</div>
					</div>
					<Checkbox
						label="Is Main Viewscreen?"
						checked={linkedViewscreen.isMainViewscreen ?? false}
						disabled={
							!linkedViewscreen.isMainViewscreen &&
							viewscreens.some(
								(v) => v.id !== linkedViewscreen.id && v.isMainViewscreen,
							)
						}
						onChange={(e) =>
							q.plugin.bridge.updateViewscreen.netSend({
								pluginId,
								bridgeId,
								viewscreenId: linkedViewscreen.id,
								isMainViewscreen: e.target.checked,
							})
						}
					/>
					<Checkbox
						label="Show Gizmos"
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
					<Checkbox
						label="Show Layout"
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
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-1">
							<span className="text-xs text-gray-300">Broken Settings</span>
							<InfoTip>
								<div className="text-xs space-y-1">
									<p>
										<strong>Fully Broken:</strong> No cameras, no gizmos, no
										displays when offline.
									</p>
									<p>
										<strong>Camera Broken Only:</strong> Cameras go offline but
										gizmos and displays still work.
									</p>
									<p>
										<strong>Invincible:</strong> Cannot be broken by in-game
										damage events.
									</p>
								</div>
							</InfoTip>
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
									brokenMode: val as
										| "fullyBroken"
										| "cameraBrokenOnly"
										| "invincible",
								})
							}
						/>
					</div>
				</>
			)}
			{/* Station element: station name dropdown */}
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
							})),
						]}
						selected={element.stationName ?? "__none__"}
						setSelected={(val) =>
							update({
								stationName: val === "__none__" ? "" : val,
							})
						}
					/>
				</>
			)}
			{/* Shared: Client Name */}
			<Input
				labelHidden={false}
				label={<>Client Name <InfoTip>When a flight client has this name, it will be auto-assigned to this {element.type === "station" ? "client" : "viewscreen"}.</InfoTip></>}
				defaultValue={element.clientName ?? ""}
				onBlur={(e: any) => {
					update({ clientName: e.target.value.trim() });
				}}
				onKeyDown={(e: any) => {
					if (e.key === "Enter") e.target.blur();
				}}
			/>
			{/* Position */}
			<div className="flex gap-2 text-xs">
				<label className="flex flex-col gap-1 flex-1">
					<span className="text-gray-300">X (px)</span>
					<input
						key={`x-${Math.round(element.x)}`}
						type="number"
						defaultValue={Math.round(element.x)}
						onKeyDown={(e: any) => {
							if (e.key === "Enter") {
								const val = Number(e.target.value);
								if (Number.isFinite(val)) {
									update({ x: val });
								} else {
									e.target.value = Math.round(element.x);
								}
							}
						}}
						onBlur={(e: any) => {
							e.target.value = Math.round(element.x);
						}}
						className="w-full bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white"
					/>
				</label>
				<label className="flex flex-col gap-1 flex-1">
					<span className="text-gray-300">Y (px)</span>
					<input
						key={`y-${Math.round(element.y)}`}
						type="number"
						defaultValue={Math.round(element.y)}
						onKeyDown={(e: any) => {
							if (e.key === "Enter") {
								const val = Number(e.target.value);
								if (Number.isFinite(val)) {
									update({ y: val });
								} else {
									e.target.value = Math.round(element.y);
								}
							}
						}}
						onBlur={(e: any) => {
							e.target.value = Math.round(element.y);
						}}
						className="w-full bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white"
					/>
				</label>
			</div>
			{/* Rotation slider (synced with canvas handle) */}
			<hr className="border-white/10" />
			<div className="flex flex-col gap-1 text-xs">
				<span className="text-gray-300">
					Rotation: {Math.round(element.rotation)}°
				</span>
				<div className="flex items-center gap-2">
					<input
						type="range"
						min={-180}
						max={180}
						value={Math.round(element.rotation)}
						onChange={(e) => update({ rotation: Number(e.target.value) })}
						className="flex-1"
					/>
					<input
						key={`rot-${Math.round(element.rotation)}`}
						type="number"
						min={-180}
						max={180}
						defaultValue={Math.round(element.rotation)}
						onKeyDown={(e: any) => {
							if (e.key === "Enter") {
								const val = Number(e.target.value);
								if (Number.isFinite(val)) {
									update({ rotation: val });
								}
							}
						}}
						onBlur={(e: any) => {
							e.target.value = Math.round(element.rotation);
						}}
						className="w-14 bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white"
					/>
				</div>
			</div>
			{/* Size overrides */}
			{(() => {
				const hasOverride =
					element.widthPixels != null || element.heightPixels != null;
				return (
					<>
						<Checkbox
							label="Override Scale"
							checked={hasOverride}
							onChange={(e) => {
								if (e.target.checked) {
									update({
										widthPixels: Math.round(elementScale),
										heightPixels: Math.round(elementScale),
									});
								} else {
									update({ widthPixels: null, heightPixels: null });
								}
							}}
						/>
						<div className="flex flex-col gap-1 text-xs">
							<span className={hasOverride ? "text-gray-300" : "text-gray-600"}>
								Width (px)
							</span>
							<div className="flex items-center gap-2">
								<input
									type="range"
									min={4}
									max={Math.round(elementScale * 5)}
									value={Math.round(element.widthPixels ?? elementScale)}
									onChange={(e) =>
										update({ widthPixels: Number(e.target.value) })
									}
									className="flex-1"
									disabled={!hasOverride}
								/>
								<input
									key={`w-${Math.round(element.widthPixels ?? elementScale)}`}
									type="number"
									min={4}
									defaultValue={Math.round(element.widthPixels ?? elementScale)}
									onKeyDown={(e: any) => {
										if (e.key === "Enter") {
											const val = Number(e.target.value);
											if (val > 0) {
												update({ widthPixels: val });
											} else {
												e.target.value = Math.round(
													element.widthPixels ?? elementScale,
												);
											}
										}
									}}
									onBlur={(e: any) => {
										e.target.value = Math.round(
											element.widthPixels ?? elementScale,
										);
									}}
									className="w-14 bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white disabled:opacity-40"
									disabled={!hasOverride}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1 text-xs">
							<span className={hasOverride ? "text-gray-300" : "text-gray-600"}>
								Height (px)
							</span>
							<div className="flex items-center gap-2">
								<input
									type="range"
									min={4}
									max={Math.round(elementScale * 5)}
									value={Math.round(element.heightPixels ?? elementScale)}
									onChange={(e) =>
										update({ heightPixels: Number(e.target.value) })
									}
									className="flex-1"
									disabled={!hasOverride}
								/>
								<input
									key={`h-${Math.round(element.heightPixels ?? elementScale)}`}
									type="number"
									min={4}
									defaultValue={Math.round(
										element.heightPixels ?? elementScale,
									)}
									onKeyDown={(e: any) => {
										if (e.key === "Enter") {
											const val = Number(e.target.value);
											if (val > 0) {
												update({ heightPixels: val });
											} else {
												e.target.value = Math.round(
													element.heightPixels ?? elementScale,
												);
											}
										}
									}}
									onBlur={(e: any) => {
										e.target.value = Math.round(
											element.heightPixels ?? elementScale,
										);
									}}
									className="w-14 bg-gray-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white disabled:opacity-40"
									disabled={!hasOverride}
								/>
							</div>
						</div>
					</>
				);
			})()}
			<Button className="btn-error btn-xs w-full" onClick={onDelete}>
				{element.type === "station" ? "Delete Client" : "Delete Viewscreen"}
			</Button>
		</div>
	);
}

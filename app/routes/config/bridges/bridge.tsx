import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import { useParams, useNavigate, Navigate } from "react-router";
import Button from "@thorium/ui/Button";
import { toast } from "@thorium/context/ToastContext";
import { useState, useRef } from "react";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { q } from "@thorium/context/AppContext";
import { MapCanvas } from "./mapEditor/MapCanvas";
import type {
	BridgeClientAssignment,
	BridgeViewscreen,
	BridgeLevel,
} from "@thorium/.server/classes/Plugins/Bridge";

interface BridgeData {
	name: string;
	description: string;
	stationComplementRef?: { pluginId: string; stationComplementId: string };
	clientAssignments: BridgeClientAssignment[];
	viewscreens: BridgeViewscreen[];
	levels: BridgeLevel[];
}

type Tab = "details" | "map";

const tabs: { id: Tab; label: string }[] = [
	{ id: "details", label: "Details" },
	{ id: "map", label: "Map" },
];

export default function BridgeDetail() {
	const { bridgeId, pluginId } = useParams() as {
		bridgeId: string;
		pluginId: string;
	};
	const navigate = useNavigate();
	const confirm = useConfirm();
	const [activeTab, setActiveTab] = useState<Tab>("details");

	const [rawItem] = q.plugin.bridge.get.useNetRequest({
		pluginId,
		bridgeId,
	});
	const item = rawItem as BridgeData | null;

	if (!bridgeId || !item)
		return <Navigate to={`/config/${pluginId}/bridges`} />;

	return (
		<fieldset key={bridgeId} className="flex-1 overflow-y-auto min-h-0 min-w-0">
			<div className="flex flex-col gap-4 min-w-0 h-full">
				{/* Tab bar */}
				<div className="flex gap-1 border-b border-white/20">
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							className={`px-4 py-2 text-sm font-medium transition-colors ${
								activeTab === tab.id
									? "text-white border-b-2 border-blue-400"
									: "text-gray-400 hover:text-white"
							}`}
							onClick={() => setActiveTab(tab.id)}
						>
							{tab.label}
						</button>
					))}
				</div>

				{/* Tab content */}
				<div className="flex-1 min-h-0 overflow-y-auto">
					{activeTab === "details" && (
						<DetailsTab pluginId={pluginId} bridgeId={bridgeId} item={item} />
					)}
					{activeTab === "map" && (
						<MapTab pluginId={pluginId} bridgeId={bridgeId} item={item} />
					)}
				</div>

				{/* Delete */}
				<div className="shrink-0 pb-4">
					<Button
						className="w-full btn-outline btn-error btn-sm"
						onClick={async () => {
							if (
								!(await confirm({
									header: "Are you sure you want to delete this bridge?",
									body: "All bridge data will be permanently removed.",
								}))
							)
								return;
							await q.plugin.bridge.delete.netSend({
								pluginId,
								bridgeId,
							});
							navigate(`/config/${pluginId}/bridges`);
						}}
					>
						Delete Bridge
					</Button>
				</div>
			</div>
		</fieldset>
	);
}

function DetailsTab({
	pluginId,
	bridgeId,
	item,
}: {
	pluginId: string;
	bridgeId: string;
	item: BridgeData;
}) {
	const navigate = useNavigate();
	const [nameError, setNameError] = useState(false);

	return (
		<div className="flex flex-col gap-4 max-w-xl">
			<Input
				labelHidden={false}
				isInvalid={nameError}
				invalidMessage="Name is required"
				label="Name"
				defaultValue={item.name}
				onChange={() => setNameError(false)}
				onBlur={async (e: any) => {
					if (!e.target.value) return setNameError(true);
					try {
						const result = await q.plugin.bridge.update.netSend({
							pluginId,
							bridgeId,
							name: e.target.value,
						});
						navigate(
							`/config/${pluginId}/bridges/${encodeURIComponent(result.bridgeId)}`,
						);
					} catch (err) {
						if (err instanceof Error) {
							toast({
								title: "Error renaming bridge",
								body: err.message,
								color: "error",
							});
						}
					}
				}}
			/>
			<Input
				as="textarea"
				className="!h-20"
				labelHidden={false}
				label="Description"
				defaultValue={item.description}
				onBlur={(e: any) =>
					q.plugin.bridge.update.netSend({
						pluginId,
						bridgeId,
						description: e.target.value,
					})
				}
			/>
		</div>
	);
}

function MapTab({
	pluginId,
	bridgeId,
	item,
}: {
	pluginId: string;
	bridgeId: string;
	item: BridgeData;
}) {
	const prompt = usePrompt();
	const confirm = useConfirm();
	const [activeLevelId, setActiveLevelId] = useState<string | null>(
		item.levels[0]?.id ?? null,
	);
	const activeLevel = item.levels.find((f) => f.id === activeLevelId) ?? null;

	const [complements] = q.plugin.bridge.allStationComplements.useNetRequest({
		pluginId,
	});
	const complementList = (complements ?? []) as {
		pluginId: string;
		stationComplementId: string;
		label: string;
	}[];
	const selectedComplement = item.stationComplementRef
		? `${item.stationComplementRef.pluginId}:${item.stationComplementRef.stationComplementId}`
		: "__none__";

	const [stationNames] =
		q.plugin.bridge.getStationComplementStations.useNetRequest({
			pluginId,
			bridgeId,
		});
	const stations = ((stationNames ?? []) as string[])
		.slice()
		.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

	// Collect all station names that have been assigned to a client element across all levels
	const assignedStations = new Set<string>();
	for (const level of item.levels) {
		for (const el of level.elements) {
			if (el.type === "station" && el.stationName) {
				assignedStations.add(el.stationName);
			}
		}
	}

	const fileInputRef = useRef<HTMLInputElement>(null);

	async function handleBackgroundUpload(file: File) {
		if (!activeLevel) return;

		const dimensions = await getImageDimensions(file);

		await q.plugin.bridge.uploadLevelBackground.netSend({
			pluginId,
			bridgeId,
			levelId: activeLevel.id,
			file,
			imageWidth: dimensions.width,
			imageHeight: dimensions.height,
		});
	}

	return (
		<div className="flex flex-col gap-2 h-full">
			{/* Station complement selector + station list */}
			<div className="flex gap-4 items-start flex-wrap">
				<Select
					label="Station Complement"
					className="w-64"
					items={[
						{ id: "__none__", label: "None" },
						...complementList.map((c) => ({
							id: `${c.pluginId}:${c.stationComplementId}`,
							label: c.label,
						})),
					]}
					selected={selectedComplement}
					setSelected={(val) => {
						if (!val || val === "__none__") {
							q.plugin.bridge.updateStationComplement.netSend({
								pluginId,
								bridgeId,
								stationComplementRef: null,
							});
						} else {
							const [scPluginId, ...rest] = val.split(":");
							const stationComplementId = rest.join(":");
							q.plugin.bridge.updateStationComplement.netSend({
								pluginId,
								bridgeId,
								stationComplementRef: {
									pluginId: scPluginId,
									stationComplementId,
								},
							});
						}
					}}
				/>
				{stations.length > 0 && (
					<div className="flex flex-col gap-1 pt-5">
						<div className="flex gap-1 items-center flex-wrap">
							{stations.map((name) => (
								<span
									key={name}
									className={`px-2 py-0.5 text-xs rounded ${
										assignedStations.has(name)
											? "bg-green-800/50 text-green-300 border border-green-500/40"
											: "bg-white/5 text-gray-400 border border-white/10"
									}`}
								>
									{name}
								</span>
							))}
						</div>
						<div className="flex gap-3 text-[10px] text-gray-500">
							<span className="flex items-center gap-1">
								<span className="inline-block w-2 h-2 rounded-sm bg-white/5 border border-white/10" />
								Unassigned
							</span>
							<span className="flex items-center gap-1">
								<span className="inline-block w-2 h-2 rounded-sm bg-green-800/50 border border-green-500/40" />
								Assigned
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Level tabs */}
			<div className="flex gap-2 items-center flex-wrap">
				{item.levels.map((level) => (
					<button
						key={level.id}
						type="button"
						className={`px-3 py-1 text-sm rounded ${
							activeLevelId === level.id
								? "bg-blue-600 text-white"
								: "bg-white/10 text-gray-300 hover:bg-white/20"
						}`}
						onClick={() => setActiveLevelId(level.id)}
					>
						{level.name}
					</button>
				))}
				<Button
					className="btn-success btn-xs"
					onClick={async () => {
						const name = await prompt({ header: "Level name" });
						if (typeof name !== "string") return;
						const result = await q.plugin.bridge.addLevel.netSend({
							pluginId,
							bridgeId,
							name,
						});
						setActiveLevelId(result.levelId);
					}}
				>
					+ Level
				</Button>
				{activeLevel && (
					<>
						<Button
							className="btn-warning btn-xs"
							onClick={async () => {
								const name = await prompt({
									header: "Rename level",
									defaultValue: activeLevel.name,
								});
								if (typeof name !== "string") return;
								await q.plugin.bridge.updateLevel.netSend({
									pluginId,
									bridgeId,
									levelId: activeLevel.id,
									name,
								});
							}}
						>
							Rename
						</Button>
						<Button
							className="btn-error btn-xs"
							onClick={async () => {
								if (
									!(await confirm({
										header: `Delete level "${activeLevel.name}"?`,
									}))
								)
									return;
								await q.plugin.bridge.removeLevel.netSend({
									pluginId,
									bridgeId,
									levelId: activeLevel.id,
								});
								setActiveLevelId(item.levels[0]?.id ?? null);
							}}
						>
							Delete
						</Button>
					</>
				)}
			</div>

			{/* Background management */}
			{activeLevel && (
				<div className="flex gap-2 items-center">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*,.svg"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file) handleBackgroundUpload(file);
							e.target.value = "";
						}}
					/>
					<Button
						className="btn-primary btn-xs"
						onClick={() => fileInputRef.current?.click()}
					>
						{activeLevel.backgroundUrl
							? "Replace Background"
							: "Upload Background"}
					</Button>
					{activeLevel.backgroundUrl && (
						<Button
							className="btn-ghost btn-xs"
							onClick={async () => {
								if (!(await confirm({ header: "Remove background image?" })))
									return;
								await q.plugin.bridge.removeLevelBackground.netSend({
									pluginId,
									bridgeId,
									levelId: activeLevel.id,
								});
							}}
						>
							Remove Background
						</Button>
					)}
				</div>
			)}

			{/* Canvas */}
			{activeLevel ? (
				<MapCanvas
					pluginId={pluginId}
					bridgeId={bridgeId}
					level={activeLevel}
					viewscreens={item.viewscreens}
					stationNames={stations}
					clientAssignments={item.clientAssignments}
					assignedStations={assignedStations}
				/>
			) : (
				<div className="flex-1 flex items-center justify-center text-gray-500">
					Add a level to start building the bridge map.
				</div>
			)}
		</div>
	);
}

/** Read image dimensions client-side using an Image element */
function getImageDimensions(
	file: File,
): Promise<{ width: number; height: number }> {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
			URL.revokeObjectURL(url);
		};
		img.onerror = () => {
			// Fallback to defaults if we can't read the image
			resolve({ width: 800, height: 800 });
			URL.revokeObjectURL(url);
		};
		img.src = url;
	});
}

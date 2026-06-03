import { ProcessedData } from "@thorium/cards/Legacy/SensorScans/ProcessedData";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { OutputField, TypingField } from "@thorium/ui/Core";
import { Icon } from "@thorium/ui/Icon";
import Select from "@thorium/ui/Select";
import { cn } from "@thorium/utils/cn";
import { randomFromList } from "@thorium/utils/operations/randomFromList";
import { useRef, useState } from "react";

export function LegacySensorScansCore() {
	const { shipId } = useStation();
	const [sensors] = q.legacy.sensorScans.sensors.useNetRequest({ shipId });
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const [processedDataHistory, setProcessedDataHistory] = useState(false);

	const [scans] = q.legacy.sensorScans.scans.useNetRequest({ shipId });

	const [selectedScanId, setSelectedScanId] = useState<number | null>(null);
	const selectedScan = sensors.scanHistory ? scans.find((s) => s.id === selectedScanId) : scans[0];

	return (
		<div className="flex h-full min-h-0 flex-col text-xs">
			<div className="flex justify-between">
				<div>
					<Button className="btn-xs btn-active">External</Button>
					<Button className="btn-xs">Internal</Button>
				</div>
				<Checkbox
					label="Scan History"
					labelProps={{ className: "text-xs" }}
					checked={sensors.scanHistory}
					onClick={(event) =>
						q.legacy.sensorScans.setScanHistory.netSend({
							shipId,
							scanHistory: event.currentTarget.checked,
						})
					}
				/>
				<Button
					className={cn("btn-xs btn-warning", {
						"btn-active": processedDataHistory,
					})}
					onClick={() => setProcessedDataHistory((t) => !t)}
				>
					Processed Data History
				</Button>
			</div>
			<div className="grid min-h-0 flex-1 grid-cols-4">
				{sensors.scanHistory ? (
					<ul className="list-group overflow-x-hidden overflow-y-auto bg-gray-900">
						{scans.map((s) => (
							<li
								key={s.id}
								className={cn(
									"list-group-item list-group-item-small break-words flex gap-2 whitespace-pre-wrap justify-between",
									{
										selected: selectedScanId === s.id,
										"bg-red-500/20": s.inProgress,
									},
								)}
								onClick={() => {
									setSelectedScanId(s.id);
									inputRef.current?.focus();
								}}
							>
								<div className="overflow-hidden break-words whitespace-pre-wrap">{s.request}</div>
								<Icon
									name="loader"
									className={cn("animate-spin shrink-0", {
										"opacity-0": !s.inProgress,
									})}
								/>
							</li>
						))}
					</ul>
				) : null}
				<div
					className={cn("flex flex-col col-span-4", {
						"col-span-3": sensors.scanHistory || processedDataHistory,
						"col-span-2": sensors.scanHistory && processedDataHistory,
					})}
				>
					<OutputField
						className="h-4 grow-[2] break-words whitespace-pre-wrap"
						alert={selectedScan?.inProgress}
					>
						{selectedScan ? `${selectedScan?.scanType} - ${selectedScan?.request}` : ""}
					</OutputField>
					<TypingField className="h-4 grow-[4]" ref={inputRef} />
				</div>
				{processedDataHistory ? (
					<div className="overflow-y-auto bg-gray-900 p-2">
						<ProcessedData />
					</div>
				) : null}
			</div>
			<div className="flex items-center">
				<Button
					className="btn-xs btn-primary flex-1"
					onClick={() =>
						q.legacy.sensorScans.scanResponse.netSend({
							scanId: selectedScan?.id || -1,
							response: inputRef.current?.value || "",
						})
					}
				>
					Send
				</Button>
				<Select
					items={sensors.presetAnswers.map((a) => ({
						id: a.value,
						label: a.label,
					}))}
					size="xxs"
					label="Answers"
					placeholder="Answers"
					labelHidden
					selected={null}
					setSelected={(value) => {
						if (inputRef.current && typeof value !== "number") {
							inputRef.current.value = processPresetAnswer(value);
						}
					}}
				/>
				<Select
					items={sensors.presetInfo.map((a) => ({
						id: a.value,
						label: a.label,
					}))}
					size="xxs"
					label="Info"
					placeholder="Info"
					labelHidden
					selected={null}
					setSelected={(value) => {
						if (inputRef.current && typeof value !== "number") {
							inputRef.current.value = processPresetAnswer(value);
						}
					}}
				/>
				<Button
					className="btn-xs btn-warning flex-1"
					onClick={() =>
						q.sensors.sendProcessedData.netSend({
							shipId,
							data: inputRef.current?.value || "",
							flash: true,
						})
					}
				>
					F&S
				</Button>
				<Button
					className="btn-xs btn-success flex-1"
					onClick={() =>
						q.sensors.sendProcessedData.netSend({
							shipId,
							data: inputRef.current?.value || "",
						})
					}
				>
					Data
				</Button>
			</div>
			<div className="flex items-center">
				<Button className="btn-xs flex-1">Probe Data</Button>
				<Button className="btn-xs btn-warning flex-1">Flash & Send Probe Data</Button>
			</div>
		</div>
	);
}

function processPresetAnswer(answer: string | null) {
	switch (answer?.toLowerCase()) {
		case null:
			return "";
		case "#weakness":
			return `Fault in ${randomFromList([
				"engines",
				"shields",
				"weapons",
				"hull",
				"sensors",
				"communications",
				"tractor beam",
			])} detected.`;
		case "#omnicourse":
			return `Course Calculated:
      X: ${Math.round(Math.random() * 100000) / 100}
      Y: ${Math.round(Math.random() * 100000) / 100}
      Z: ${Math.round(Math.random() * 100000) / 100}`;
		case "#thrusterdodge":
			return `Incoming weapons detected. Recommend firing ${randomFromList([
				"port",
				"starboard",
				"forward",
				"reverse",
				"up",
				"down",
			])} thrusters to dodge.`;
		default:
			return answer as string;
	}
}

import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Input from "@thorium/ui/Input";
import { useImperativeHandle, useRef, type RefObject } from "react";
import scanVid from "./scansvid.mp4?url";
import { TypingText } from "@thorium/components/TypingText";
import { cn } from "@thorium/utils/cn";

export function SensorScans({
	scanType = "Standard",
	selectedScan: selectedScanId,
	setSelectedScan,
	focusRef,
}: {
	scanType?: string;
	selectedScan?: number | null;
	setSelectedScan?: (val: number) => void;
	focusRef?: RefObject<{ newScan: () => void } | null>;
}) {
	const { shipId } = useStation();
	const [scans] = q.legacy.sensorScans.scans.useNetRequest({ shipId });
	const inputRef = useRef<HTMLInputElement>(null);
	const selectedScan =
		typeof selectedScanId === "number"
			? scans.find((s) => s.id === selectedScanId)
			: selectedScanId === null
				? null
				: scans[0];
	const inProgress = selectedScan?.inProgress;

	useImperativeHandle(focusRef, () => ({
		newScan() {
			if (inputRef.current) {
				inputRef.current.value = "";
				inputRef.current.focus();
			}
		},
	}));
	return (
		<>
			<Input
				as="textarea"
				label="Sensor Scan Entry"
				className="input-alert resize-none px-4 py-4"
				ref={inputRef}
				defaultValue={selectedScan?.request}
				disabled={selectedScan?.inProgress}
			/>
			{inProgress ? (
				<Button
					className="btn-error"
					onClick={() =>
						q.legacy.sensorScans.cancelScan.netSend({
							scanId: selectedScan?.id || -1,
						})
					}
				>
					Cancel Scan
				</Button>
			) : (
				<Button
					className="btn-primary"
					onClick={async () => {
						if (inputRef.current?.value) {
							const { scanId } = await q.legacy.sensorScans.beginScan.netSend({
								shipId,
								scan: inputRef.current?.value || "",
								scanType,
							});
							setSelectedScan?.(scanId);
						}
					}}
				>
					Begin Scan
				</Button>
			)}
			<div className="flex flex-col flex-1">
				<p>Scan Results</p>
				<div className="relative">
					<video
						src={scanVid}
						muted
						autoPlay
						loop
						className={cn(
							"w-full rounded-lg p-0.5 absolute opacity-0 pointer-events-none transition-opacity duration-300",
							{ "opacity-100 pointer-events-auto": inProgress },
						)}
					/>
					<div className="panel panel-alert flex-1 aspect-video p-4 whitespace-pre-wrap">
						{selectedScan?.response || ""}
					</div>
				</div>
			</div>
		</>
	);
}

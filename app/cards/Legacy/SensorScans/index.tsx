import { SensorScans } from "@thorium/cards/Legacy/SensorScans/SensorScans";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import { useRef, useState } from "react";

export function LegacySensorScans() {
	const [scanType, setScanType] = useState("Standard");
	const { shipId } = useStation();
	const [sensors] = q.legacy.sensorScans.sensors.useNetRequest({ shipId });
	const [scans] = q.legacy.sensorScans.scans.useNetRequest({ shipId });
	const [selectedScan, setSelectedScan] = useState<number | null>(null);
	const focusRef = useRef<{ newScan: () => void }>(null);
	return (
		<div className="grid h-full grid-cols-7 gap-8">
			{sensors.scanHistory ? (
				<div className="col-span-2 flex h-full min-h-0 flex-col gap-2">
					<ul className="panel panel-alert list-group flex-1 gap-2 overflow-y-auto">
						{scans.map((scan) => (
							<li
								key={scan.id}
								className={cn("list-group-item flex justify-between break-all gap-2", {
									selected: selectedScan === scan.id,
								})}
								onClick={() => setSelectedScan(scan.id)}
							>
								{scan.request}
								<Icon
									name="loader"
									className={cn("animate-spin shrink-0", {
										"opacity-0": !scan.inProgress,
									})}
								/>
							</li>
						))}
					</ul>
					<Button
						className="btn-secondary w-full"
						onClick={() => {
							setSelectedScan(null);
							focusRef.current?.newScan();
						}}
					>
						New Scan
					</Button>
				</div>
			) : null}
			<div
				className={cn("flex flex-col col-span-3 min-h-0 gap-2", {
					"col-start-2": !sensors.scanHistory,
				})}
			>
				<SensorScans
					scanType={scanType}
					selectedScan={selectedScan}
					setSelectedScan={setSelectedScan}
					focusRef={focusRef}
				/>
			</div>
			<div className="col-span-2 space-y-2">
				<p className="-mb-2">Scan Type</p>
				<Button
					className={cn("btn-primary w-full", {
						"btn-active": scanType === "Standard",
					})}
					onClick={() => setScanType("Standard")}
				>
					Standard
				</Button>
				<Button
					className={cn("btn-primary w-full", {
						"btn-active": scanType === "Organic",
					})}
					onClick={() => setScanType("Organic")}
				>
					Organic
				</Button>
				<Button
					className={cn("btn-primary w-full", {
						"btn-active": scanType === "Inorganic",
					})}
					onClick={() => setScanType("Inorganic")}
				>
					Inorganic
				</Button>
				<Button
					className={cn("btn-primary w-full", {
						"btn-active": scanType === "Infrared",
					})}
					onClick={() => setScanType("Infrared")}
				>
					Infrared
				</Button>
				<Button
					className={cn("btn-primary w-full", {
						"btn-active": scanType === "Subspace",
					})}
					onClick={() => setScanType("Subspace")}
				>
					Subspace
				</Button>
			</div>
		</div>
	);
}

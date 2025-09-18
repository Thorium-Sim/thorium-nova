import { SensorGrid } from "@thorium/cards/Legacy/SensorGrid/SensorGrid";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { cn } from "@thorium/utils/cn";
import { useRef, useState } from "react";

export function LegacySensorGrid() {
	const { shipId } = useStation();

	const gridRef = useRef<HTMLDivElement>(null);
	const [contactInfo, setContactInfo] = useState<{
		name: string;
		picture: string | null;
	} | null>(null);
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });
	const [pageVal, setPage] = useState<"contacts" | "options">("contacts");
	const page = sensors.pingActive ? pageVal : "contacts";

	return (
		<div className="h-full grid grid-cols-5 overflow-hidden justify-items-center">
			<SensorGrid
				className="col-span-4 bg-black/50 overflow-hidden"
				gridRef={gridRef}
				onContactHover={(name, picture) => setContactInfo({ name, picture })}
				onGridHover={() => setContactInfo(null)}
			/>
			<div className="w-full my-4 flex flex-col gap-2">
				{sensors.pingActive ? (
					<div className="flex gap-4">
						<Button
							className={cn("btn-success flex-1 btn-sm", {
								"btn-active": page === "contacts",
							})}
							onClick={() => setPage("contacts")}
						>
							Contacts
						</Button>
						<Button
							className={cn("btn-info flex-1 btn-sm", {
								"btn-active": page === "options",
							})}
							onClick={() => setPage("options")}
						>
							Options
						</Button>
					</div>
				) : null}
				{page === "contacts" ? (
					<>
						<div>
							<p>Contact Info</p>
							<div className="panel aspect-video p-4">
								{contactInfo?.picture ? (
									<img
										src={contactInfo?.picture}
										alt=""
										className="w-full h-full object-contain"
									/>
								) : null}
							</div>
						</div>
						<div className="panel p-4 h-20">{contactInfo?.name}</div>
						{sensors.pingActive && sensors.pingMode === "manual" ? (
							<Button
								className="w-full btn-success"
								onClick={() =>
									q.legacy.sensorGrid.triggerPing.netSend({
										shipId,
									})
								}
							>
								Sonar Ping
							</Button>
						) : null}
					</>
				) : page === "options" ? (
					<>
						<div>
							<p>Sensor Options</p>
							<Button
								className={cn("w-full btn-warning mb-2", {
									"btn-active": sensors.pingMode === "active",
								})}
								onClick={() =>
									q.legacy.sensorGrid.setPingMode.netSend({
										shipId,
										pingMode: "active",
									})
								}
							>
								Active Scan
							</Button>
							<Button
								className={cn("w-full btn-primary mb-2", {
									"btn-active": sensors.pingMode === "passive",
								})}
								onClick={() =>
									q.legacy.sensorGrid.setPingMode.netSend({
										shipId,
										pingMode: "passive",
									})
								}
							>
								Passive Scan
							</Button>
							<Button
								className={cn("w-full btn-notice", {
									"btn-active": sensors.pingMode === "manual",
								})}
								onClick={() =>
									q.legacy.sensorGrid.setPingMode.netSend({
										shipId,
										pingMode: "manual",
									})
								}
							>
								Manual Scan
							</Button>
							<hr
								className={cn(
									"my-2 opacity-0 transition-opacity duration-300",
									{
										"opacity-100": sensors.pingMode === "manual",
									},
								)}
							/>
							<Button
								className={cn(
									"w-full btn-success opacity-0 !transition-opacity !duration-300 pointer-events-none",
									{
										"opacity-100 pointer-events-auto":
											sensors.pingMode === "manual",
									},
								)}
								onClick={() =>
									q.legacy.sensorGrid.triggerPing.netSend({
										shipId,
									})
								}
							>
								Sonar Ping
							</Button>
						</div>
					</>
				) : null}
				<div className="flex-1 flex flex-col">
					<p>Processed Data</p>
					<div className="panel flex-1" />
				</div>
			</div>
		</div>
	);
}

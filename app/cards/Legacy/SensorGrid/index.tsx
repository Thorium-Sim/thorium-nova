import { SensorGrid } from "@thorium/cards/Legacy/SensorGrid/SensorGrid";
import { DamageOverlay } from "@thorium/components/DamageOverlay";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { cn } from "@thorium/utils/cn";
import { useRef, useState } from "react";
import scanVid from "../SensorScans/scansvid.mp4?url";
import { ProcessedData } from "@thorium/cards/Legacy/SensorScans/ProcessedData";
import Input from "@thorium/ui/Input";
import { TypingText } from "@thorium/components/TypingText";
import { SensorScans } from "@thorium/cards/Legacy/SensorScans/SensorScans";

export function LegacySensorGrid() {
	const { shipId, station } = useStation();
	const { isWidget } = useCardContext();

	const layout =
		station.name === "Viewscreen"
			? "viewscreen"
			: isWidget ||
					station.cards.some((c) => c.component === "LegacySensorScans")
				? "noScans"
				: "full";

	const gridRef = useRef<HTMLDivElement>(null);
	const [contactInfo, setContactInfo] = useState<{
		name: string;
		picture: string | null;
	} | null>(null);
	const [sensors] = q.legacy.sensorGrid.sensors.useNetRequest({ shipId });
	const [pageVal, setPage] = useState<"contacts" | "options">("contacts");
	const page = sensors.pingActive ? pageVal : "contacts";

	return (
		<div className={"h-full grid gap-8 grid-cols-4 justify-items-center"}>
			{layout === "full" ? (
				<div className="w-full my-4 flex flex-col gap-2">
					<SensorScans />
				</div>
			) : null}
			<div
				className={cn("relative col-start-1 row-start-1  aspect-square", {
					"col-span-3": layout === "noScans",
					"col-span-2 col-start-2": layout === "full",
					"col-span-4": layout === "viewscreen",
				})}
			>
				<DamageOverlay
					systemId={sensors.id}
					className="rounded-full bg-black"
				/>
			</div>
			<SensorGrid
				className={cn("row-start-1 col-start-1 bg-black/50 overflow-hidden", {
					"col-span-3": layout === "noScans",
					"col-span-2 col-start-2": layout === "full",
					"col-span-4": layout === "viewscreen",
				})}
				gridRef={gridRef}
				onContactHover={(name, picture) => setContactInfo({ name, picture })}
				onGridHover={() => setContactInfo(null)}
			/>
			{layout === "viewscreen" ? null : (
				<div className="w-full my-4 flex flex-col gap-2 min-h-0">
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
								<div className="panel panel-alert p-4 h-20">
									{contactInfo?.name}
								</div>
							</div>
							<div className="panel panel-alert aspect-video p-4">
								{contactInfo?.picture ? (
									<img
										src={contactInfo?.picture}
										alt=""
										className="w-full h-full object-contain"
									/>
								) : null}
							</div>
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
					<div className="flex-1 flex flex-col min-h-0">
						<p>Processed Data</p>
						<ProcessedData className="panel panel-alert flex-1 p-4 overflow-y-auto overflow-x-hidden" />
					</div>
				</div>
			)}
		</div>
	);
}

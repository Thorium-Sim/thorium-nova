import { DamageReport } from "@thorium/cards/DamageReports/DamageReport";
import {
	systemCategories,
	systemFilterValues,
	systemSortValues,
} from "@thorium/cards/DamageReports/systemCategories";
import { clientId, q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import RadialDial from "@thorium/ui/RadialDial";
import Select from "@thorium/ui/Select";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import type { DamageEffects } from "@thorium/utils/flags/damageTypes";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { capitalCase } from "change-case";
import { Suspense, useRef, useState, type ReactNode } from "react";

/**
 * Things this card does:
 * - Display the efficiency of every system
 * - Display the offline state of every system
 * - Generate and pick a damage report
 * - List the active damage reports
 * - List the damage report steps
 *
 * - Workflow:
 *  - Systems are ordered by efficiency
 * 	- Pick a system
 *  - Generate reports for the system
 *  - Pick a report to do
 *  - Report appears in the "Active Reports" section
 *
 *
 * Ideas:
 * - Turn efficiency into another damage metric, and display the "Damage" aggregate value to the crew
 * - Different levels of diagnostics generate better reports, but take longer to generate
 * - Use the "Lights Out" game, or some other kind of mini-game speed up the diagnostic process
 * - Reports have an expiration time, when they'll still repair, but be less effective
 * - You can only have one active report on a system at a time (concurrent reports might conflict with each other in universe), but you can abort reports and generate new ones if needed
 */

export function DamageReports() {
	const { shipId } = useStation();
	q.damageReports.stream.useDataStream({ shipId });
	const [systems] = q.damageReports.systems.useNetRequest({ shipId }, { refetchInterval: 1000 });

	const [selectedFilter, setSelectedFilter] = useState("All");
	const [selectedSort, setSelectedSort] = useState("Damage");

	const [selectedEntity, setSelectedEntity] = useState<number | null>(null);
	const [damageReports] = q.damageReports.damageReports.useNetRequest({
		shipId,
	});

	const selectedReport = damageReports.find((d) => d.id === selectedEntity);
	const selectedSystem = systems.find((d) => d.id === selectedEntity);

	return (
		<div className="grid h-full w-full grid-flow-col grid-cols-4 grid-rows-[auto_2fr_auto_5fr_auto] gap-x-4">
			<div className="damage-reports-list contents">
				<h3>Reports</h3>
				<ul className="list-group panel mb-4 min-h-0 w-full overflow-y-auto">
					{damageReports.map((d) => (
						<li
							key={d.id}
							className={cn("list-group-item", {
								selected: selectedEntity === d.id,
							})}
							onClick={() => {
								q.thorium.genericEvent.netSend({
									clientId,
									eventName: "damage-report-selected",
									properties: `${d.id}`,
								});
								setSelectedEntity(d.id);
							}}
						>
							{d.name}
						</li>
					))}
				</ul>
			</div>
			<div className="contents">
				<h3>Systems</h3>
				<ul className="damage-systems-list list-group panel mb-4 min-h-0 w-full overflow-y-auto">
					{systems
						.filter((s) => selectedFilter === "All" || systemCategories[s.type] === selectedFilter)
						.sort((a, b) => {
							switch (selectedSort) {
								case "Name":
									if (a.name > b.name) return 1;
									if (a.name < b.name) return -1;
									return 0;
								case "Type":
									if (systemCategories[a.type] > systemCategories[b.type]) return 1;
									if (systemCategories[a.type] < systemCategories[b.type]) return -1;
									return 0;
								case "Offline":
									if (a.offline && b.offline) return 0;
									if (a.offline) return 1;
									if (b.offline) return -1;
									return 0;
								case "Damage":
									return b.damage - a.damage;
								default:
									return 0;
							}
						})
						.map((s) => (
							<SystemItem
								key={s.id}
								{...s}
								isSelected={selectedEntity === s.id}
								onClick={() => {
									setSelectedEntity(s.id);
									q.thorium.genericEvent.netSend({
										clientId,
										eventName: "damage-system-pick",
										properties: `${s.id}`,
									});
								}}
							/>
						))}
				</ul>
			</div>
			<div className="filter-sort-dropdowns flex justify-between gap-2">
				<Select
					className="select-alert flex-1"
					label="Filter"
					selected={selectedFilter}
					items={[
						{ id: "All", label: "All" },
						...systemFilterValues.map((f) => ({ id: f, label: f })),
					]}
					setSelected={(f) => setSelectedFilter(f || "All")}
				/>
				<Select
					className="select-alert flex-1"
					label="Sort"
					selected={selectedSort}
					items={systemSortValues.map((f) => ({ id: f, label: f }))}
					setSelected={(f) => setSelectedSort(f || "Name")}
				/>
			</div>
			{selectedSystem ? (
				<SystemDetails
					systemId={selectedSystem.id}
					name={selectedSystem.name || ""}
					setSelectedReportId={(id) => setSelectedEntity(id)}
				/>
			) : null}
			{selectedReport ? <DamageReport {...selectedReport} /> : null}
		</div>
	);
}

function SystemItem({
	id,
	damage,
	offline,
	name,
	isSelected,
	onClick,
}: {
	id: number;
	damage: number;
	offline: boolean;
	name: string;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<li className={cn("list-group-item", { selected: isSelected })} onClick={onClick}>
			<span className={offline ? "text-red-500" : ""}>{name}</span>
			<span className="flex items-center gap-2">
				<span className="w-[4ch] text-right tabular-nums">
					<Tooltip content="Aggregate Damage">{Math.round(damage * 100)}%</Tooltip>
				</span>
				<progress className={"progress progress-success"} max={1} value={damage} />
				<Suspense
					fallback={
						<RadialDial color="#0f0" label="" count={0}>
							—
						</RadialDial>
					}
				>
					<SystemDiagnosticIndicator id={id} />
				</Suspense>
			</span>
		</li>
	);
}

function SystemDiagnosticIndicator({ id }: { id: number }) {
	const [diagnostic] = q.damageReports.systemDiagnostic.useNetRequest({
		systemId: id,
	});
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();
	const ref = useRef<{ setValue: (value: number) => void }>(null);

	useAnimationFrame(() => {
		if (!ref.current || !diagnostic) return;
		const value = interpolate(diagnostic?.id);
		if (!value) return;
		ref.current.setValue(value.x);
	}, cardLoaded);

	if (!diagnostic)
		return (
			<RadialDial color="#0f0" label="" count={0}>
				—
			</RadialDial>
		);
	return (
		<RadialDial count={diagnostic.progress} max={1} color="#0f0" label="" ref={ref}>
			{diagnostic.level}
		</RadialDial>
	);
}

function SystemDetails({
	systemId,
	setSelectedReportId,
}: {
	systemId: number;
	name: string;
	setSelectedReportId: (id: number) => void;
}) {
	const { shipId } = useStation();

	const [diagnostic] = q.damageReports.systemDiagnostic.useNetRequest({
		systemId: systemId,
	});
	const [damageReports] = q.damageReports.damageReports.useNetRequest({
		shipId,
	});
	if (!systemId) return null;

	const systemDamageReport = damageReports.find((s) => s.systemId === systemId);
	if (systemDamageReport) {
		return (
			<div className="col-span-3 row-span-5 flex flex-col items-center justify-center gap-4">
				<h2 className="text-4xl">Damage Report In Progress...</h2>
				<Button className="btn-alert" onClick={() => setSelectedReportId(systemDamageReport.id)}>
					Go To Report
				</Button>
			</div>
		);
	}
	if (!diagnostic) {
		return (
			<div className="diagnostics-list col-span-3 row-span-5 flex flex-col items-center justify-center gap-4">
				<Button
					className="btn-lg btn-info"
					onClick={() => {
						q.damageReports.diagnosticCreate.netSend({
							level: "1",
							systemId: systemId,
						});
					}}
				>
					Level 1 Diagnostic
				</Button>
				<Button
					className="btn-lg btn-success"
					onClick={() => {
						q.damageReports.diagnosticCreate.netSend({
							level: "2",
							systemId: systemId,
						});
					}}
				>
					Level 2 Diagnostic
				</Button>
				<Button
					className="btn-lg btn-warning"
					onClick={() => {
						q.damageReports.diagnosticCreate.netSend({
							level: "3",
							systemId: systemId,
						});
					}}
				>
					Level 3 Diagnostic
				</Button>
				<Button
					className="btn-lg btn-error"
					onClick={() => {
						q.damageReports.diagnosticCreate.netSend({
							level: "4",
							systemId: systemId,
						});
					}}
				>
					Level 4 Diagnostic
				</Button>
			</div>
		);
	}

	if (diagnostic.reportCandidates) {
		return <ReportCandidates systemId={systemId} setSelectedReportId={setSelectedReportId} />;
	}

	if (diagnostic.results) {
		return <SystemMetrics systemId={systemId} />;
	}

	if (diagnostic.progress < 1) {
		return (
			<div className="diagnostic-candidates col-span-3 row-span-5 mx-auto flex w-1/2 flex-col items-center justify-center gap-4">
				Level {diagnostic.level} Diagnostic In Progress...
				<DiagnosticProgress diagnosticId={diagnostic.id} progress={diagnostic.progress} />
				<Button
					className="btn-warning mx-auto"
					onClick={() =>
						q.damageReports.diagnosticAbort.netSend({
							diagnosticId: diagnostic.id,
						})
					}
				>
					Reset Diagnostic
				</Button>
			</div>
		);
	}
}

function DiagnosticProgress({
	diagnosticId,
	progress,
}: {
	diagnosticId: number;
	progress: number;
}) {
	const ref = useRef<HTMLProgressElement>(null);
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();

	useAnimationFrame(() => {
		if (!ref.current) return;
		const value = interpolate(diagnosticId);
		if (!value) return;
		ref.current.value = value.x;
	}, cardLoaded);

	return <progress ref={ref} className="progress progress-alert" max={1} value={progress} />;
}

function SystemMetrics({ systemId }: { systemId: number }) {
	const [diagnostic] = q.damageReports.systemDiagnostic.useNetRequest({
		systemId: systemId,
	});

	const metrics = diagnostic?.results;
	if (!metrics) return null;

	const reportCount = Number(diagnostic.level) - 1;

	return (
		<div className="diagnostic-candidates col-span-3 row-span-5 mx-auto h-full w-5/6 overflow-hidden">
			<div className="flex flex-col gap-2">
				<MetricPanel
					id="efficiency"
					diagnosticId={diagnostic.id}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={metrics.efficiency}
					reverseThresholds
					name="Efficiency"
					description="The amount of power applied to a system that is turned into work."
					reportCount={reportCount}
				>
					<Icon name="power-node" className="size-5" />
				</MetricPanel>
				<MetricPanel
					id="heatMultiplier"
					diagnosticId={diagnostic.id}
					upperThreshold={1.7}
					lowerThreshold={1.3}
					value={metrics.heatMultiplier}
					name="Heat Multiplier"
					description="A multiplier indicating how much heat is generated compared to baseline performance."
					reportCount={reportCount}
				>
					<Icon name="flame" className="size-5" />
				</MetricPanel>
				<MetricPanel
					id="instability"
					diagnosticId={diagnostic.id}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={metrics.instability}
					name="Instability"
					description="The chance a command sent to a system will fail to execute on the first try."
					reportCount={reportCount}
				>
					<Icon name="diamond-minus" className="size-5" />
				</MetricPanel>
				<MetricPanel
					id="signature"
					diagnosticId={diagnostic.id}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={metrics.signature}
					name="Sensors Signature"
					description="How much this system contributes to the ship's visibility on the sensors of other ships."
					reportCount={reportCount}
				>
					<Icon name="eye" className="size-5" />
				</MetricPanel>
				<MetricPanel
					id="failureRisk"
					diagnosticId={diagnostic.id}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={metrics.failureRisk}
					name="Spontaneous Failure Risk"
					description="The chance this system will spontaneously go offline."
					reportCount={reportCount}
				>
					<Icon name="circle-slash" className="size-5" />
				</MetricPanel>
				<MetricPanel
					id="cascadeRisk"
					diagnosticId={diagnostic.id}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={metrics.cascadeRisk}
					name="Cascade Failure Risk"
					description="The chance this system will cause damage to other systems when it goes offline."
					reportCount={reportCount}
				>
					<Icon name="octagon-alert" className="size-5" />
				</MetricPanel>
				<MetricPanel
					id="crewSafetyRating"
					diagnosticId={diagnostic.id}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={metrics.crewSafetyRating}
					name="Crew Safety Rating"
					description="The likelihood that crew members working near this system will experience adverse health effects."
					reportCount={reportCount}
				>
					<Icon name="user-plus" className="size-5" />
				</MetricPanel>
				<Button
					className="btn-warning mx-auto"
					onClick={() =>
						q.damageReports.diagnosticAbort.netSend({
							diagnosticId: diagnostic.id,
						})
					}
				>
					Reset Diagnostic
				</Button>
			</div>
		</div>
	);
}

function MetricPanel({
	id,
	diagnosticId,
	children,
	value,
	reverseThresholds,
	upperThreshold,
	lowerThreshold,
	name,
	description,
	reportCount,
}: {
	id: DamageEffects;
	diagnosticId: number;
	children: ReactNode;
	value: number;
	reverseThresholds?: boolean;
	upperThreshold: number;
	lowerThreshold: number;
	name: string;
	description: string;
	reportCount: number;
}) {
	let state = "nominal";
	if (
		reverseThresholds
			? value <= upperThreshold && value > lowerThreshold
			: value >= lowerThreshold && value < upperThreshold
	) {
		state = "warning";
	}
	if (reverseThresholds ? value <= lowerThreshold : value >= upperThreshold) {
		state = "danger";
	}

	return (
		<div className={cn("group p-2 tabular-nums flex! items-center gap-2 panel")}>
			<div
				className={cn(
					"bg-white/20 rounded-full w-8 h-8 flex items-center justify-center",
					state === "nominal"
						? "text-green-500"
						: state === "warning"
							? "text-warning"
							: "text-error",
				)}
			>
				{children}
			</div>
			<div className="flex-1">
				<p className="text-xl font-medium">{name}</p>
				<p className="text-gray-300">{description}</p>
			</div>
			<div
				className={cn(
					"text-lg w-[5ch] text-right",
					state === "nominal"
						? "text-green-500"
						: state === "warning"
							? "text-warning"
							: "text-error",
				)}
			>
				{damageMetricFormats[id](value)}
			</div>
			<Tooltip
				content={
					reportCount === 0 ? (
						<p>
							No reports for Level 1 Diagnostics. <br />
							Perform a Level 2 Diagnostic or higher to generate reports.
						</p>
					) : null
				}
			>
				<Button
					className={cn("btn-sm w-[23ch]", { "btn-info": reportCount > 0 })}
					disabled={reportCount === 0}
					onClick={() => {
						q.damageReports.diagnosticReportCandidateCreate.netSend({
							damageMetric: id,
							diagnosticId,
						});
					}}
				>
					<Icon name="wrench" className="mr-2 size-5" />
					Generate Report{reportCount > 1 ? "s" : ""}
				</Button>
			</Tooltip>
		</div>
	);
}

function ReportCandidates({
	systemId,
	setSelectedReportId,
}: {
	systemId: number;
	setSelectedReportId: (id: number) => void;
}) {
	const [diagnostic] = q.damageReports.systemDiagnostic.useNetRequest({
		systemId: systemId,
	});

	const reports = diagnostic?.reportCandidates;
	if (!reports) return null;

	return (
		<div className="diagnostic-candidates col-span-3 row-span-5 mx-auto flex h-full w-5/6 flex-col justify-around overflow-hidden">
			<div className="grid grid-cols-3 grid-rows-[auto_auto_auto] gap-4">
				{reports.map((report) => (
					<div key={report.id} className="panel row-span-3 grid grid-rows-subgrid p-4">
						<h2 className="text-center text-xl font-bold">{report.type} Maintenance</h2>
						<ul>
							{report.affectedSystems.map((sys) => (
								<li key={`${sys.id}${Object.keys(sys.effects).join("")}`} className="mb-4">
									<span className="text-lg">{sys.name}</span>
									<ul className="ml-4 list-disc">
										{Object.entries(sys.effects).map(([name, value]) => (
											<li
												key={`${name}${value}`}
												className={cn({
													"text-red-500": name === "efficiency" ? value < 0 : value > 0,
													"text-green-500": name === "efficiency" ? value > 0 : value < 0,
												})}
											>
												{capitalCase(name)}: {value > 0 ? "+" : ""}
												{damageMetricFormats[name as DamageEffects](value)}
											</li>
										))}
									</ul>
								</li>
							))}
						</ul>
						<Button
							className="btn-success w-full"
							onClick={async () => {
								const { reportId } = await q.damageReports.beginDamageReportFromDiagnostic.netSend({
									diagnosticId: diagnostic.id,
									reportCandidateId: report.id,
								});

								setSelectedReportId(reportId);
							}}
						>
							Begin Report
						</Button>
					</div>
				))}
			</div>
			<Button
				className="btn-warning mx-auto"
				onClick={() =>
					q.damageReports.diagnosticAbort.netSend({
						diagnosticId: diagnostic.id,
					})
				}
			>
				Reset Diagnostic
			</Button>
		</div>
	);
}

const damageMetricFormats: Record<DamageEffects, (value: number) => ReactNode> = {
	efficiency: (val) => `${Math.floor(val * 100)}%`,
	heatMultiplier: (val) => <>&times;{Math.round(val * 100) / 100}</>,
	instability: (val) => `${Math.round(val * 100)}%`,
	signature: (val) => Math.round(val * 100),
	failureRisk: (val) => `${Math.round(val * 10000) / 100}%`,
	cascadeRisk: (val) => `${Math.round(val * 1000) / 10}%`,
	crewSafetyRating: (val) => `${Math.round(val * 100)}%`,
};

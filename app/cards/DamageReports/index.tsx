import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import RadialDial from "@thorium/ui/RadialDial";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
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
	const [systems] = q.damageReports.systems.useNetRequest(
		{ shipId },
		{ refetchInterval: 1000 },
	);

	const [selectedSystem, setSelectedSystem] = useState<number | null>(181);

	return (
		<div className="w-full h-full grid grid-cols-4 gap-4">
			<div className="flex flex-col gap-2 col-span-1 overflow-hidden">
				<h3>Reports</h3>
				<ul className="list-group panel w-full overflow-y-auto flex-1">
					<li className="list-group-item">Warp Engines Electrical Repair</li>
					<li className="list-group-item">Thrusters Plumbing Repair</li>
				</ul>
				<h3>Systems</h3>
				<ul className="list-group panel w-full min-h-0 overflow-y-auto flex-1">
					{systems.map((s) => (
						<SystemItem
							key={s.id}
							{...s}
							isSelected={selectedSystem === s.id}
							onClick={() => setSelectedSystem(s.id)}
						/>
					))}
				</ul>
				<div className="flex gap-2 justify-start flex-wrap justify-self-end">
					<Button className="btn-sm">All</Button>
					<Button className="btn-sm btn-primary">Propulsion</Button>
					<Button className="btn-sm">Defense</Button>
					<Button className="btn-sm">Power</Button>
					<Button className="btn-sm">Communications</Button>
					<Button className="btn-sm">Science</Button>
					<Button className="btn-sm">Misc.</Button>
				</div>
			</div>
			{selectedSystem ? (
				<SystemDetails
					systemId={selectedSystem}
					name={systems.find((s) => s.id === selectedSystem)?.name || ""}
				/>
			) : null}
		</div>
	);
}

function SystemItem({
	id,
	damage,
	name,
	isSelected,
	onClick,
}: {
	id: number;
	damage: number;
	name: string;
	isSelected: boolean;
	onClick: () => void;
}) {
	return (
		<li
			className={cn("list-group-item", { selected: isSelected })}
			onClick={onClick}
		>
			{name}
			<span className="flex items-center gap-2">
				<span className="w-[4ch] tabular-nums text-right">
					<Tooltip content="Aggregate Damage">
						{Math.round(damage * 100)}%
					</Tooltip>
				</span>
				<progress
					className={"progress progress-success"}
					max={1}
					value={damage}
				/>
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
		<RadialDial
			count={diagnostic.progress}
			max={1}
			color="#0f0"
			label=""
			ref={ref}
		>
			{diagnostic.level}
		</RadialDial>
	);
}

function SystemDetails({ systemId, name }: { systemId: number; name: string }) {
	const [diagnostic] = q.damageReports.systemDiagnostic.useNetRequest({
		systemId: systemId,
	});

	if (!diagnostic) {
		return (
			<div className="flex flex-col gap-4 col-span-3 items-center justify-center">
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

	if (diagnostic.progress < 1) {
		return (
			<div className="flex flex-col gap-4 items-center justify-center w-1/2 mx-auto col-span-3">
				Level {diagnostic.level} Diagnostic In Progress...
				<DiagnosticProgress
					diagnosticId={diagnostic.id}
					progress={diagnostic.progress}
				/>
				<Button
					className="mx-auto btn-warning"
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
	if (diagnostic.progress >= 1) {
		return <SystemCard systemId={systemId} />;
	}
}

function DiagnosticProgress({
	diagnosticId,
	progress,
}: { diagnosticId: number; progress: number }) {
	const ref = useRef<HTMLProgressElement>(null);
	const { interpolate } = useLiveQuery();
	const { cardLoaded } = useCardContext();

	useAnimationFrame(() => {
		if (!ref.current) return;
		const value = interpolate(diagnosticId);
		if (!value) return;
		ref.current.value = value.x;
	}, cardLoaded);

	return (
		<progress
			ref={ref}
			className="progress progress-alert"
			max={1}
			value={progress}
		/>
	);
}

function SystemCard({ systemId }: { systemId: number }) {
	const [diagnostic] = q.damageReports.systemDiagnostic.useNetRequest({
		systemId: systemId,
	});

	const metrics = diagnostic?.results;
	if (!metrics) return null;

	const reportCount = Number(diagnostic.level) - 1;

	return (
		<div className="col-span-3 w-5/6 mx-auto h-full overflow-hidden">
			<div className="flex flex-col gap-2">
				<MetricPanel
					format={(val) => `${Math.floor(val * 100)}%`}
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
					format={(val) => <>&times;{Math.round(val * 100) / 100}</>}
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
					format={(val) => `${Math.round(val * 100)}%`}
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
					format={(val) => Math.round(val * 100)}
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
					format={(val) => `${Math.round(val * 10000) / 100}%`}
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
					format={(val) => `${Math.round(val * 1000) / 10}%`}
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
					format={(val) => `${Math.round(val * 100)}%`}
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
					className="mx-auto btn-warning"
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
	children,
	value,
	format,
	reverseThresholds,
	upperThreshold,
	lowerThreshold,
	name,
	description,
	reportCount,
}: {
	children: ReactNode;
	format: (val: number) => ReactNode;
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
		<div
			className={cn("group p-2 tabular-nums !flex items-center gap-2 panel")}
		>
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
				<p className="font-medium text-xl">{name}</p>
				<p className="text-gray-300">{description}</p>
			</div>
			{/* <div className="overflow-hidden relative">
					<Icon
						name="wrench"
						className="size-5 -translate-y-full group-hover:translate-y-0 transition-transform absolute top-0 left-0"
					/>
				
				</div> */}
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
				{format(value)}
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
				>
					<Icon name="wrench" className="size-5 mr-2" />
					Generate Report{reportCount > 1 ? "s" : ""}
				</Button>
			</Tooltip>
		</div>
	);
}

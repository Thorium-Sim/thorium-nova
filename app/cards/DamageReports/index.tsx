import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import type { ReactNode } from "react";

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
	const [systems] = q.damageReports.systems.useNetRequest({ shipId });

	return (
		<div className="w-full h-full grid grid-cols-4">
			{/* <h1 className="w-full text-center text-2xl font-medium">Efficiency</h1>
			<div className="flex-1 bg">
				<div className="flex h-full justify-between ">
					{systems.map((sys) => {
						const efficiency = Math.random();
						return (
							<div className="flex flex-col">
								<div className="flex-1 relative">
									<div
										className={cn("bg-green-500 absolute bottom-0 w-full", {
											"bg-green-500": efficiency > 0.8,
											"bg-yellow-500": efficiency <= 0.8 && efficiency > 0.5,
											"bg-red-500": efficiency < 0.5,
										})}
										style={{
											height: `${efficiency * 100}%`,
										}}
									/>
								</div>
								<div className="border-t" />
								<div className="-rotate-90 w-[2rem] h-[12ch] whitespace-nowrap translate-x-[4.5ch] translate-y-[4.5ch] text-right">
									{sys.name}
								</div>
							</div>
						);
					})}
				</div>
			</div> */}
			<div className="flex flex-col gap-2 col-span-1 overflow-hidden">
				<h3>Reports</h3>
				<ul className="list-group panel w-full overflow-y-auto flex-1">
					<li className="list-group-item">Warp Engines Electrical Repair</li>
					<li className="list-group-item">Thrusters Plumbing Repair</li>
				</ul>
				<h3>Systems</h3>
				<ul className="list-group panel w-full min-h-0 overflow-y-auto flex-1">
					{systems.map((s) => (
						<li className="list-group-item" key={s.id}>
							{s.name}
							<span className="flex items-center gap-2">
								<span className="w-[4ch] tabular-nums text-right">
									<Tooltip content="Aggregate Damage">
										{Math.round(s.damage * 100)}%
									</Tooltip>
								</span>
								<progress
									className={"progress progress-success"}
									max={1}
									value={s.damage}
								/>
							</span>
						</li>
					))}
				</ul>
				{/* {systems.map((s) => (
					<SystemCard key={s.id} name={s.name} efficiency={s.efficiency} />
				))} */}
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
		</div>
	);
}

function SystemCard({
	name,
	// efficiency,
}: { name: string; efficiency: number }) {
	const efficiency = Math.random();
	const heatRate = Math.round(Math.random() * 10) / 10 + 1;
	const instability = Math.round(Math.random() * 10) / 10;
	const signature = Math.round(Math.random() * 10 * 2) / 10;
	const failureRisk = Math.round(Math.random() * 10) / 10;
	const cascadeRisk = Math.round(Math.random() * 10) / 10;
	const crewSafetyRating = Math.round(Math.random() * 10) / 10;
	return (
		<div className={cn("panel p-2 max-w-fit")}>
			<div className="flex gap-2 justify-between mb-2">
				<span className="whitespace-nowrap font-medium">{name}</span>
			</div>
			<div className="flex gap-1 justify-around">
				<MetricPanel
					format={(val) => `${Math.round(val * 100)}%`}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={efficiency}
					reverseThresholds
					name="Efficiency"
				>
					<Icon name="power-node" className="size-5" />
				</MetricPanel>
				<MetricPanel
					format={(val) => <>&times;{val}</>}
					upperThreshold={1.7}
					lowerThreshold={1.3}
					value={heatRate}
					name="Heat Rate"
				>
					<Icon name="flame" className="size-5" />
				</MetricPanel>
				<MetricPanel
					format={(val) => `${val}%`}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={instability}
					name="Instability"
				>
					<Icon name="diamond-minus" className="size-5" />
				</MetricPanel>
				<MetricPanel
					format={(val) => val}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={signature}
					name="Sensors Signature"
				>
					<Icon name="eye" className="size-5" />
				</MetricPanel>
				<MetricPanel
					format={(val) => `${val}%`}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={failureRisk}
					name="Spontaneous Failure Risk"
				>
					<Icon name="circle-slash" className="size-5" />
				</MetricPanel>
				<MetricPanel
					format={(val) => `${val}%`}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={cascadeRisk}
					name="Cascade Failure Risk"
				>
					<Icon name="octagon-alert" className="size-5" />
				</MetricPanel>
				<MetricPanel
					format={(val) => `${val}%`}
					upperThreshold={0.8}
					lowerThreshold={0.5}
					value={crewSafetyRating}
					name="Crew Safety Rating"
				>
					<Icon name="user-plus" className="size-5" />
				</MetricPanel>
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
}: {
	children: ReactNode;
	format: (val: number) => ReactNode;
	value: number;
	reverseThresholds?: boolean;
	upperThreshold: number;
	lowerThreshold: number;
	name: string;
}) {
	return (
		<Tooltip content={name}>
			<Button
				className={cn(
					{
						"btn-success": reverseThresholds
							? value > upperThreshold
							: value < lowerThreshold,
						"btn-warning": reverseThresholds
							? value <= upperThreshold && value > lowerThreshold
							: value >= lowerThreshold && value < upperThreshold,
						"btn-error": reverseThresholds
							? value <= lowerThreshold
							: value >= upperThreshold,
					},
					// We need no shadow to prevent performance issues when rendering many buttons on the page.
					"group p-1 tabular-nums !flex !flex-col items-center !min-h-min !h-auto !px-1 !text-xs w-[6ch] !shadow-none",
				)}
			>
				<div className="overflow-hidden relative">
					<Icon
						name="wrench"
						className="size-5 -translate-y-full group-hover:translate-y-0 transition-transform absolute top-0 left-0"
					/>
					<div className="group-hover:translate-y-full transition-transform">
						{children}
					</div>
				</div>
				{format(value)}
			</Button>
		</Tooltip>
	);
}

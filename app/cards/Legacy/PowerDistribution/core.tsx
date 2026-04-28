import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { InputField, OutputField } from "@thorium/ui/Core";
import { cn } from "@thorium/utils/cn";

export function LegacySystemsCore() {
	const { shipId } = useStation();
	const [systems] = q.legacy.powerDistribution.systems.useNetRequest({
		shipId,
	});
	const [reactors] = q.legacy.powerDistribution.reactors.useNetRequest({
		shipId,
	});

	const systemsPower = systems.reduce((acc, sys) => acc + sys.currentPower, 0);

	const reactorPower = reactors.reduce(
		(prev, reactor) =>
			prev + Math.round(reactor.maxOutput * reactor.efficiency * (reactor.offline ? 0 : 1)),
		0,
	);

	return (
		<table className="w-full text-xs">
			<thead>
				<tr className="border-b border-white/40">
					<th className="text-left">System</th>
					<th className="text-right">Set</th>
					<th />
					<th className="text-left">Req</th>
					<th title="Upgraded">U</th>
					<th title="Flux">F</th>
				</tr>
			</thead>
			<tbody>
				{systems.map((sys) => (
					<tr key={sys.id} className="border-b border-white/20">
						<td
							className={cn("text-left", {
								"text-orange-300": sys.currentPower >= sys.powerLevels[sys.powerLevels.length - 1],
								"text-gray-400": sys.currentPower < sys.powerLevels[0],
								"text-red-500": sys.offline,
							})}
							title={
								sys.offline
									? "Damaged"
									: sys.currentPower < sys.powerLevels[0]
										? "Insufficient Power"
										: sys.currentPower >= sys.powerLevels[sys.powerLevels.length - 1]
											? "Overloaded Power"
											: ""
							}
							onClick={() =>
								q.legacy.powerDistribution.setOffline.netSend({
									systemId: sys.id,
									offline: !sys.offline,
								})
							}
						>
							{sys.name}
						</td>
						<td className="text-right">
							<InputField
								prompt="What is the power?"
								onClick={(value) => {
									if (!Number.isNaN(Number(value))) {
										q.legacy.powerDistribution.setPower.netSend({
											systemId: sys.id,
											currentPower: Number(value),
										});
									}
								}}
							>
								{sys.currentPower}
							</InputField>
						</td>
						<td className="text-center">/</td>
						<td className="text-left">
							<OutputField>{sys.powerLevels[0]}</OutputField>
						</td>
						<td className="">
							<div className="flex justify-center">
								<Checkbox label="Upgraded" labelHidden />
							</div>
						</td>
						<td className="">
							<div className="flex justify-center">
								<Button
									className="btn-warning btn-xs !h-4 !min-h-4"
									title="Flux System Power"
									onClick={() =>
										q.legacy.powerDistribution.fluxSystemPower.netSend({
											systemId: sys.id,
										})
									}
								/>
							</div>
						</td>
					</tr>
				))}
				{reactors.map((r, i) => (
					<tr
						key={r.id}
						className={cn("border-b border-white/20", {
							"border-t-2 border-t-white/80": i === 0,
						})}
					>
						<td
							className={cn("text-left", {
								"text-red-500": r.offline,
							})}
							onClick={() =>
								q.legacy.powerDistribution.setOffline.netSend({
									systemId: r.id,
									offline: !r.offline,
								})
							}
						>
							{r.name}
						</td>

						<td>
							<InputField
								title="Max Reactor Output"
								prompt="What is the new max reactor output?"
								onClick={(value) => {
									if (!Number.isNaN(Number(value))) {
										q.legacy.powerDistribution.setReactorPower.netSend({
											systemId: r.id,
											maxOutput: Number(value),
										});
									}
								}}
							>
								{r.maxOutput}
							</InputField>
						</td>
						<td />
						<td>
							<OutputField title="Reactor Output">
								{Math.round(r.maxOutput * r.efficiency * (r.offline ? 0 : 1))}
							</OutputField>
						</td>
						<td>
							<InputField
								title="Reactor Efficiency"
								prompt="What is the new reactor efficiency?"
								promptValue={r.efficiency * 100}
								onClick={(value) => {
									if (!Number.isNaN(Number(value))) {
										q.legacy.powerDistribution.setReactorEfficiency.netSend({
											systemId: r.id,
											efficiency: Number(value) / 100,
										});
									}
								}}
							>
								{Math.round(r.efficiency * 100)}%
							</InputField>
						</td>
					</tr>
				))}
				<tr className="border-t-2 border-t-white/80">
					<td>Total</td>
					<td>
						<OutputField title="System Power Consumption" alert={systemsPower > reactorPower}>
							{systemsPower}
						</OutputField>
					</td>
					<td className="text-center">/</td>
					<td>
						<OutputField title="Reactor Output">{reactorPower}</OutputField>
					</td>
					<td />
				</tr>
				<tr>
					<td colSpan={6}>
						<div className="flex justify-end">
							<Button
								className="btn-xs btn-warning"
								onClick={() =>
									q.legacy.powerDistribution.fluxSystemPower.netSend({
										shipId,
										random: true,
									})
								}
							>
								Flux Random
							</Button>
							<Button
								className="btn-xs btn-error"
								onClick={() =>
									q.legacy.powerDistribution.fluxSystemPower.netSend({
										shipId,
										all: true,
									})
								}
							>
								Flux All
							</Button>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

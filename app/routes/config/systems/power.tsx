import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { toast } from "@thorium/context/ToastContext";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { produce } from "immer";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";

import { OverrideResetButton } from "./OverrideResetButton";

const numSort = (a: number, b: number) => a - b;
export default function Power() {
	const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());

	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const key = `${systemId}${rekey}`;
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});

	if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

	return (
		<fieldset key={key} className="flex-1 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="flex pb-4">
						<div className="flex flex-col">
							<label htmlFor="power-levels">Power Levels</label>
							<div className="flex gap-2">
								{system.powerLevels.sort(numSort).map((p, i) => (
									<div key={`${p}-${i}`} className="group relative">
										<input
											className="input w-[5ch] text-center tabular-nums"
											max={40}
											defaultValue={p}
											onBlur={(event) => {
												if (Number.isNaN(Number(event.target.value))) return;
												q.plugin.systems.update.netSend({
													pluginId,
													systemId,
													shipId,
													shipPluginId,
													powerLevels: produce(system.powerLevels, (draft) => {
														draft[i] = Number(event.currentTarget.value);
														draft.sort(numSort);
													}),
												});
											}}
										/>
										<button
											className="absolute top-0 right-0 hidden h-5 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-300 group-hover:flex"
											onClick={() =>
												q.plugin.systems.update.netSend({
													pluginId,
													systemId,
													shipId,
													shipPluginId,
													powerLevels: produce(system.powerLevels, (draft) => {
														draft.splice(i, 1);
													}),
												})
											}
										>
											<Icon name="ban" className="text-red-500" />
										</button>
									</div>
								))}
								<Button
									className="btn-sm btn-info"
									onClick={() => {
										q.plugin.systems.update.netSend({
											pluginId,
											systemId,
											shipId,
											shipPluginId,
											powerLevels: [
												...system.powerLevels,
												(system.powerLevels[system.powerLevels.length - 1] || 0) + 1,
											].sort(numSort),
										});
									}}
								>
									+
								</Button>
							</div>
							<p className="mb-2 text-sm leading-tight text-gray-400">
								Power indicator levels on the power management screen in MegaWatts. The lowest
								number is the minimum required power for the system to run. The highest number is
								the maximum recommended amount of power for this system. Any additional power
								consumption will cause the system to sustain damage. Values between the highest and
								lowest have no direct effect on the system and are only for convenience when
								distributing power.
							</p>
						</div>
						<OverrideResetButton property="powerLevels" setRekey={setRekey} className="mt-6" />
					</div>

					<div className="flex pb-4">
						<Input
							labelHidden={false}
							label="Default Power"
							helperText="The normal amount of power this system will request in MegaWatts."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.defaultPower}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									defaultPower: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton property="defaultPower" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="flex items-start pb-2">
						<Select
							label="Connected Battery Type"
							items={[
								{ id: "none", label: "None" },
								{ id: "capacity", label: "High Capacity" },
								{ id: "output", label: "High Output" },
								{ id: "median", label: "Median Capacity, Median Output" },
							]}
							selected={system.connectedBatteryType}
							setSelected={async (value) => {
								if (!value) return;
								try {
									await q.plugin.systems.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										connectedBatteryType: value,
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing connected battery type",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<p className="mb-2 text-sm leading-tight text-gray-400">
							What type of battery this system should be connected to by default.
						</p>

						<OverrideResetButton
							property="balancedBonusMultiplier"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

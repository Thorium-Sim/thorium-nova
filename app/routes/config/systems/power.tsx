import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { toast } from "@thorium/context/ToastContext";
import Button from "@thorium/ui/Button";
import Checkbox from "@thorium/ui/Checkbox";
import { Icon } from "@thorium/ui/Icon";
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
								{system.powerLevels.length < 2 ? (
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
								) : null}
							</div>
							{system.type === "phasers" ? (
								<p className="mb-2 text-sm leading-tight text-gray-400">
									These numbers affect the phase capacitor, not the phaser system. The lowest number
									is the charging rate, or how fast the phase capacitor can charge. The highest
									number is the output rate, which is also the base damage rate for the phaser.
								</p>
							) : (
								<p className="mb-2 text-sm leading-tight text-gray-400">
									The lowest number is the minimum required power for the system to run. The highest
									number is the maximum recommended amount of power for this system. Any additional
									power consumption will cause the system to sustain damage.
								</p>
							)}
						</div>
						<OverrideResetButton property="powerLevels" setRekey={setRekey} className="mt-6" />
					</div>

					{system.type === "phasers" ? null : (
						<div className="flex pb-4">
							<div className="flex flex-col">
								<Checkbox
									label="Activated By Default"
									helperText="Whether this system is connected to reactor power when the flight starts."
									defaultChecked={system.powerActivated}
									onChange={(e) => {
										q.plugin.systems.update.netSend({
											pluginId,
											systemId: systemId,
											shipId,
											shipPluginId,
											powerActivated: e.target.checked,
										});
									}}
								/>
							</div>
							<OverrideResetButton property="powerActivated" setRekey={setRekey} className="mt-6" />
						</div>
					)}
					<div className="flex items-start pb-2">
						<div className="flex flex-col">
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
								What type of battery this system should be connected to by default. Make sure the
								ship has a battery of this type compared to other batteries on the ship.
							</p>
						</div>

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

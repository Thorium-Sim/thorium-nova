import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { toast } from "@thorium/context/ToastContext";
import type { EngineSpeed } from "@thorium/ecs-components/shipSystems/engineSpeeds";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import { produce } from "immer";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";

import { OverrideResetButton } from "../OverrideResetButton";

export default function ImpulseEngineConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.impulse.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});
	const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
	const key = `${systemId}${rekey}`;
	if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

	async function updateSpeeds(speeds: EngineSpeed[]) {
		try {
			await q.plugin.systems.impulse.update.netSend({
				pluginId,
				systemId: systemId,
				shipId,
				shipPluginId,
				speeds,
			});
		} catch (err) {
			if (err instanceof Error) {
				toast({
					title: "Error changing speeds",
					body: err.message,
					color: "error",
				});
			}
		}
	}
	return (
		<fieldset key={key} className="flex-1 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Cruising Speed"
							placeholder={"1500"}
							helperText={"In km/s"}
							defaultValue={system.cruisingSpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.impulse.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										cruisingSpeed: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing cruising speed",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="cruisingSpeed" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Emergency Speed"
							placeholder={"2000"}
							helperText={"In km/s"}
							defaultValue={system.emergencySpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.impulse.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										emergencySpeed: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing emergency speed",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="emergencySpeed" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Thrust"
							placeholder={"12500"}
							helperText={
								"In Kilo-newtons. Affected by the mass of the ship the engines are attached to."
							}
							defaultValue={system.thrust}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.impulse.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										thrust: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing thrust",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
					</div>
					<div>
						<div>
							<label htmlFor="power-levels">Speeds</label>
							<div className="flex gap-2">
								{system.speeds.map(({ label, number }, i) => (
									<div key={`${i}`} className="group relative flex flex-col">
										<Input
											label="Label"
											placeholder="Label"
											labelHidden
											className="input w-[4ch] text-center tabular-nums"
											max={40}
											defaultValue={label}
											onBlur={async (event) => {
												await updateSpeeds(
													produce(system.speeds, (draft) => {
														draft[i].label = event.currentTarget.value;
													}),
												);
											}}
										/>
										<Input
											label="Number"
											placeholder="Number"
											labelHidden
											className="input w-[4ch] text-center tabular-nums"
											max={40}
											defaultValue={number}
											onBlur={async (event) => {
												await updateSpeeds(
													produce(system.speeds, (draft) => {
														draft[i].number = event.currentTarget.value;
													}),
												);
											}}
										/>
										<button
											className="absolute top-0 right-0 hidden h-5 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-300 group-hover:flex"
											onClick={() =>
												updateSpeeds(
													produce(system.speeds, (draft) => {
														draft.splice(i, 1);
													}),
												)
											}
										>
											<Icon name="ban" className="text-red-500" />
										</button>
									</div>
								))}
								<Button
									className="btn-sm btn-info"
									onClick={async () => {
										await updateSpeeds([...system.speeds, { label: "", number: "" }]);
									}}
								>
									+
								</Button>
							</div>
							<p className="mb-2 text-sm leading-tight text-gray-400">
								Names of the speed values. The second to last speed is cruising speed, and speeds
								below that divide the cruising speed evenly. The last speed uses emergency speed.
							</p>
						</div>
						<OverrideResetButton property="speeds" setRekey={setRekey} className="mt-6" />
					</div>
				</div>
			</div>
		</fieldset>
	);
}

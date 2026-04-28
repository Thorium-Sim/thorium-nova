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

export default function WarpEngines() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.warp.get.useNetRequest({
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
			await q.plugin.systems.warp.update.netSend({
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

	// TODO: May 3, 2022 - Add sound effects configuration here
	// TODO: May 3, 2022 - Figure out how to model the warp dynamo too
	return (
		<fieldset key={key} className="flex-1 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Interstellar Cruising Speed"
							placeholder={"599600000000"}
							helperText={"For traveling through interstellar space. In km/s"}
							defaultValue={system.interstellarCruisingSpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.warp.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										interstellarCruisingSpeed: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing interstellar cruising speed",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="interstellarCruisingSpeed"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Solar Cruising Speed"
							placeholder={"29980000"}
							helperText={"For traveling through solar system space. In km/s"}
							defaultValue={system.solarCruisingSpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.warp.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										solarCruisingSpeed: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing solar cruising speed",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="solarCruisingSpeed"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Minimum Speed Multiplier"
							placeholder={"0.01"}
							helperText={
								"The min speed (warp 1) compared to the cruising speed. Defaults to 0.01, should be less than 1."
							}
							defaultValue={system.minSpeedMultiplier}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.warp.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										minSpeedMultiplier: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing minimum speed multiplier",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="minSpeedMultiplier"
							setRekey={setRekey}
							className="mt-6"
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

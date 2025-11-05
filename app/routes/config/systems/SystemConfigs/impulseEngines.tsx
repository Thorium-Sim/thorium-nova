import { useParams } from "react-router";
import Input from "@thorium/ui/Input";
import { toast } from "@thorium/context/ToastContext";
import { useContext, useReducer } from "react";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { q } from "@thorium/context/AppContext";
import { Navigate } from "@thorium/components/Navigate";
import { Icon } from "@thorium/ui/Icon";
import Button from "@thorium/ui/Button";
import type { EngineSpeed } from "@thorium/ecs-components/shipSystems/engineSpeeds";
import { produce } from "immer";

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
					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Cruising Speed"
							placeholder={"1500"}
							helperText={"In km/s"}
							defaultValue={system.cruisingSpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
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
						<OverrideResetButton
							property="cruisingSpeed"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Emergency Speed"
							placeholder={"2000"}
							helperText={"In km/s"}
							defaultValue={system.emergencySpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
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
						<OverrideResetButton
							property="emergencySpeed"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-2 flex">
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
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
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
									<div key={`${i}`} className="relative group flex flex-col">
										<Input
											label="Label"
											placeholder="Label"
											labelHidden
											className="input w-[4ch] text-center tabular-nums"
											max={40}
											defaultValue={label}
											onBlur={(event) => {
												updateSpeeds(
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
											onBlur={(event) => {
												updateSpeeds(
													produce(system.speeds, (draft) => {
														draft[i].number = event.currentTarget.value;
													}),
												);
											}}
										/>
										<button
											className="hidden group-hover:flex absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-gray-300 items-center justify-center rounded-full w-5 h-5"
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
									onClick={() => {
										updateSpeeds([...system.speeds, { label: "", number: "" }]);
									}}
								>
									+
								</Button>
							</div>
							<p className="text-gray-400 text-sm leading-tight mb-2">
								Names of the speed values. The second to last speed is cruising
								speed, and speeds below that divide the cruising speed evenly.
								The last speed uses emergency speed.
							</p>
						</div>
						<OverrideResetButton
							property="speeds"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

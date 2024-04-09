import { useParams } from "@remix-run/react";
import Input from "@thorium/ui/Input";
import { toast } from "@client/context/ToastContext";
import { useContext, useReducer } from "react";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { q } from "@client/context/AppContext";
import { Navigate } from "@client/components/Navigate";

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

	// TODO: April 21, 2022 - Add sound effects configuration here
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
						<OverrideResetButton
							property="thrust"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

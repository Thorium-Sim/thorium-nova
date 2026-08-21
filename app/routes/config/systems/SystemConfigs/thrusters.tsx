import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";

import { OverrideResetButton } from "../OverrideResetButton";

export default function ThrustersConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.thrusters.get.useNetRequest({
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
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Linear Max Speed"
							placeholder={"1"}
							helperText={"In m/s"}
							defaultValue={system.directionMaxSpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.thrusters.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										directionMaxSpeed: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing linear max speed",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="directionMaxSpeed"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Linear Acceleration"
							placeholder={"625"}
							helperText="In km/s^2"
							defaultValue={system.directionAcceleration}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.thrusters.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										directionAcceleration: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing linear acceleration",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="directionAcceleration"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Rotation Max Speed"
							placeholder={"5"}
							helperText={"In revolutions per minute"}
							defaultValue={system.rotationMaxSpeed}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.thrusters.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										rotationMaxSpeed: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing rotation max speed",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="rotationMaxSpeed" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="flex pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Rotation Acceleration"
							placeholder={"625"}
							helperText="In km/s^2"
							defaultValue={system.rotationAcceleration}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.thrusters.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										rotationAcceleration: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing rotation acceleration",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="rotationAcceleration"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

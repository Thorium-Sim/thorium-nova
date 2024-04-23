import { useParams } from "@remix-run/react";
import Input from "@thorium/ui/Input";
import { toast } from "@client/context/ToastContext";
import { useContext, useReducer } from "react";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { q } from "@client/context/AppContext";
import { Navigate } from "@client/components/Navigate";

export default function TorpedoLauncherConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.torpedoLauncher.get.useNetRequest({
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
							label="Load Time"
							placeholder={"5000"}
							helperText={"How long it takes to load a torpedo in milliseconds"}
							defaultValue={system.loadTime}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.torpedoLauncher.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										loadTime: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing load time",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="loadTime"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Fire Time"
							placeholder={"1000"}
							helperText={"How long it takes to fire a torpedo in milliseconds"}
							defaultValue={system.fireTime}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.torpedoLauncher.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										fireTime: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing fire time",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="fireTime"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Heading"
							placeholder={"0"}
							helperText={
								"Which direction the torpedo is fired in on the XZ plane. Angle in degrees from the front of the ship between 0 and 359."
							}
							defaultValue={system.headingDegree}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.torpedoLauncher.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										headingDegree: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing heading",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="headingDegree"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Fire Time"
							placeholder={"0"}
							helperText={
								"Which direction the torpedo is fired in on the ZY plane. Angle in degrees from the front of the ship between -90 and 90."
							}
							defaultValue={system.pitchDegree}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.torpedoLauncher.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										pitchDegree: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing pitch",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="pitchDegree"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

import { useParams } from "@remix-run/react";
import Input from "@thorium/ui/Input";
import { toast } from "@client/context/ToastContext";
import { useContext, useReducer } from "react";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { q } from "@client/context/AppContext";
import { Navigate } from "@client/components/Navigate";

export default function PhasersConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.phasers.get.useNetRequest({
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
							label="Max Range"
							placeholder={"10000"}
							helperText={"How far phasers can shoot at 0˚ arc in kilometers"}
							defaultValue={system.maxRange}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.phasers.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										maxRange: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing max range",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="maxRange"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Max Arc"
							placeholder={"90"}
							helperText={
								"How wide the phasers can arc in degrees from 0 to 180. Higher arc means lower range."
							}
							defaultValue={system.maxArc}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.phasers.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										maxArc: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing max arc",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="maxArc"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Yield Multiplier"
							placeholder={"1"}
							helperText={
								"Multiplies the power output from the phasers to determine the damage dealt."
							}
							defaultValue={system.yieldMultiplier}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.phasers.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										yieldMultiplier: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing yield multiplier",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="yieldMultiplier"
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
								"Which direction the phasers are fired in on the XZ plane. Angle in degrees from the front of the ship between 0 and 359."
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
							label="Pitch"
							placeholder={"0"}
							helperText={
								"Which direction the phasers are fired in on the ZY plane. Angle in degrees from the front of the ship between -90 and 90."
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

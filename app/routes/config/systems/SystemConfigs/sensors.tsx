import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { Navigate } from "@thorium/components/Navigate";

export default function SensorsConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.sensors.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});
	const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
	const key = `${systemId}${rekey}`;
	if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

	return (
		<fieldset key={key} className="flex-1 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="pb-2 flex items-start">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Passive Range"
							placeholder={"1000000"}
							helperText={
								"The maximum distance that can be seen on sensors in kilometers."
							}
							defaultValue={system.passiveRange}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.sensors.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										passiveRange: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing passive range",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="passiveRange"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex items-start">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Active Range"
							placeholder={"100000"}
							helperText={
								"The maximum distance in kilometers that active scans can be performed at the scan energy cost. Objects further can still be scanned, but the cost is exponential with the objects distance."
							}
							defaultValue={system.activeRange}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.sensors.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										activeRange: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing active range",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="activeRange"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex items-start">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Minimum Scan Energy Cost"
							placeholder={"15"}
							helperText={
								"How much energy in kilowatt hours is required to complete a scan of a target close to the ship. 5 kilowatt hour scans with 5 megawatts assigned to sensors will complete in 3.6 seconds."
							}
							defaultValue={system.minScanEnergyCost}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.sensors.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										minScanEnergyCost: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing min scan energy cost",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="minScanEnergyCost"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex items-start">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Maximum Scan Energy Cost"
							placeholder={"15"}
							helperText={
								"How much energy in kilowatt hours is required to complete a scan of a target at the active range from the ship."
							}
							defaultValue={system.maxScanEnergyCost}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.sensors.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										maxScanEnergyCost: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing max scan energy cost",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="maxScanEnergyCost"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-2 flex items-start">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Shield Penalty Multiplier"
							placeholder={"2"}
							helperText={
								"How much scan energy costs are multiplied when the target's shields are raised. Should be greater than 1."
							}
							defaultValue={system.shieldPenaltyMultiplier}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.sensors.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										shieldPenaltyMultiplier: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing shield penalty multiplier",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="shieldPenaltyMultiplier"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

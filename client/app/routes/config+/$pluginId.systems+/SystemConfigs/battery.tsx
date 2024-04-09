import { q } from "@client/context/AppContext";
import { toast } from "@client/context/ToastContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "@remix-run/react";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { Navigate } from "@client/components/Navigate";

export default function BatteryConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.battery.get.useNetRequest({
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
					<div className="pb-2 flex items-center">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Capacity"
							placeholder={"50"}
							helperText={
								"The amount of power this battery can hold in MegaWatt-Hours"
							}
							defaultValue={system.capacity}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.battery.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										capacity: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing capacity",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="capacity"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-2 flex items-center">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Charge Rate"
							placeholder={"180"}
							helperText={
								"How much energy the battery can use to charge in MegaWatts. Typically batteries charge faster than they discharge."
							}
							defaultValue={system.chargeRate}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.battery.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										chargeRate: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing charge rate",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="chargeRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-2 flex items-center">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Discharge Rate"
							placeholder={"1"}
							helperText={
								"How much energy the battery provides to connected systems."
							}
							defaultValue={system.dischargeRate}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.battery.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										dischargeRate: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing power multiplier",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="dischargeRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

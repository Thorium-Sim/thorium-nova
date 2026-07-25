import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";

import { OverrideResetButton } from "./OverrideResetButton";

export default function Heat() {
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
						<Input
							labelHidden={false}
							label="Power to Heat Ratio"
							helperText="The percentage (0 - 1) of power which passes through the system which is turned into heat."
							placeholder={`0.01`}
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.powerToHeat}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									powerToHeat: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton property="powerToHeat" setRekey={setRekey} className="mt-6" />
					</div>

					<div className="flex pb-4">
						<Input
							labelHidden={false}
							label="Nominal Heat"
							helperText="The standard heat level in Kelvin. When plotted in a heat bar, this level represents the bottom of the bar."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.nominalHeat}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									nominalHeat: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton property="nominalHeat" setRekey={setRekey} className="mt-6" />
					</div>

					<div className="flex pb-4">
						<Input
							labelHidden={false}
							label="Max Safe Heat"
							helperText="The temperature in Kelvin above which the system's efficiency starts decreasing due to overheating."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.maxSafeHeat}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									maxSafeHeat: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton property="maxSafeHeat" setRekey={setRekey} className="mt-6" />
					</div>

					<div className="flex pb-4">
						<Input
							labelHidden={false}
							label="Max Heat"
							helperText="The maximum possible temperature in Kelvin. Represents the top of the heat bar graph."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.maxHeat}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									maxHeat: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton property="maxHeat" setRekey={setRekey} className="mt-6" />
					</div>
					<p>Legacy Settings</p>
					<div className="flex pb-4">
						<Input
							labelHidden={false}
							label="Coolant Transfer Rate"
							helperText="A multiplier for how fast coolant is transferred out of this system."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.coolantTransferRate}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									coolantTransferRate: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="coolantTransferRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-4">
						<Input
							labelHidden={false}
							label="Coolant Consumption Rate"
							helperText="A multiplier for how fast coolant is consumed as a system is cooled."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.coolantConsumptionRate}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									coolantConsumptionRate: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="coolantConsumptionRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

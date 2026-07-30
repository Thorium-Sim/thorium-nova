import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";

import { OverrideResetButton } from "../OverrideResetButton";

export default function CoolantTankConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.coolantTank.get.useNetRequest({
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
					<div className="flex items-start pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Coolant Tank Capacity"
							placeholder={"1000"}
							helperText={"The max volume of the coolant tank in liters"}
							defaultValue={system.tankCapacity}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.coolantTank.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										tankCapacity: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing coolant tank volume",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="tankCapacity" setRekey={setRekey} className="mt-6" />
					</div>

					<div className="flex items-start pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Coolant Density"
							placeholder={"1000"}
							helperText={
								"The density of the coolant in kg/m^3. Used to determine flow mass and coolant mass."
							}
							defaultValue={system.coolantDensity}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.coolantTank.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										coolantDensity: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing coolant density",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="coolantDensity" setRekey={setRekey} className="mt-6" />
					</div>

					<div className="flex items-start pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Coolant Specific Heat"
							placeholder={"1000"}
							helperText={
								"Specific heat in J/gK. Used to determine how quickly heat flows in and out of coolant."
							}
							defaultValue={system.coolantSpecificHeat}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.coolantTank.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										coolantSpecificHeat: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing coolant specific heat",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="coolantSpecificHeat"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="flex items-start pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Coolant Pump Base Flow Rate"
							placeholder={"40000"}
							helperText={"How fast the pump pumps at required power in liters/minute"}
							defaultValue={system.pumpBaseFlowRate}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.coolantTank.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										pumpBaseFlowRate: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing pump base flow rate",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="pumpBaseFlowRate" setRekey={setRekey} className="mt-6" />
					</div>

					<div className="flex items-start pb-2">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Heat Radiator Area"
							placeholder={"1"}
							helperText={
								"How big the heat radiator is in square meters. Rejects heat following Stefan-Boltzmann blackbody radiation."
							}
							defaultValue={system.radiatorArea}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value))) return;
								try {
									await q.plugin.systems.coolantTank.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										radiatorArea: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing radiator area`",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton property="radiatorArea" setRekey={setRekey} className="mt-6" />
					</div>
				</div>
			</div>
		</fieldset>
	);
}

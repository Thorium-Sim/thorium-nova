import { q } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { Navigate } from "@thorium/components/Navigate";

export default function MainComputerConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.mainComputer.get.useNetRequest({
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
							label="Minimum Diagnostic Energy Cost"
							placeholder={"15"}
							helperText={
								"How much energy in kilowatt hours is required to complete a level 1 diagnostic. 5 kilowatt hour diagnostics with 5 megawatts assigned to the main computer will complete in 3.6 seconds."
							}
							defaultValue={system.minDiagnosticEnergyCost}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.mainComputer.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										minDiagnosticEnergyCost: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing min diagnostic energy cost",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="minDiagnosticEnergyCost"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex items-start">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Maximum Diagnostic Energy Cost"
							placeholder={"15"}
							helperText={
								"How much energy in kilowatt hours is required to complete a level 4 diagnostic."
							}
							defaultValue={system.maxDiagnosticEnergyCost}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.mainComputer.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										maxDiagnosticEnergyCost: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing max diagnostic energy cost",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="maxDiagnosticEnergyCost"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

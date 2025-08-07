import { q } from "@thorium/context/AppContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "./OverrideResetButton";
import { Navigate } from "@thorium/components/Navigate";

export default function Damage() {
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
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Offline Efficiency"
							helperText="How low the system efficiency must get before the system goes offline."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.offlineEfficiency}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									offlineEfficiency: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="offlineEfficiency"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Online Efficiency"
							helperText="How high the system efficiency must get before the system goes from offline to online."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.onlineEfficiency}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									onlineEfficiency: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="onlineEfficiency"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Overload Damage Multiplier"
							helperText="A multiplier to determine how much the efficiency will drop as power in the system goes over the Max Safe Power. If Max Safe Power is 5 and Current Power is 10, and the multiplier is set to 1, then 1 unit of damage will be applied across the system damage metrics over the course of 1 second."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.overloadDamageMultiplier}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									overloadDamageMultiplier: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="overloadDamageMultiplier"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Minimum Signature"
							helperText="The minimum sensors signature this system adds, regardless of how well repaired the system is."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.minSignature}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									minSignature: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="minSignature"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Minimum Signature"
							helperText="The maximum sensors signature this system can add."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.maxSignature}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									maxSignature: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="maxSignature"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Signature Spike"
							helperText="How much is added to the system's sensor signature when the system is actively in use."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.signatureSpike}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									signatureSpike: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="signatureSpike"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Signature Spike Duration"
							helperText="How many seconds the signature spike lasts when the system is no longer in use."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.signatureSpikeDuration}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									signatureSpikeDuration: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="signatureSpikeDuration"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Entropy Multiplier"
							helperText="A multiplier for the entropy which continually applies damage across all damage metrics. Slowly increases damage so there's always something to repair."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.entropyMultiplier}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									entropyMultiplier: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="entropyMultiplier"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

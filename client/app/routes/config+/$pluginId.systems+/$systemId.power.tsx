import { q } from "@client/context/AppContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "@remix-run/react";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "./OverrideResetButton";
import { Navigate } from "@client/components/Navigate";

export default function Power() {
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
							label="Required Power"
							helperText="The minimum amount of power required to make this system operate in MegaWatts."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.requiredPower}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									requiredPower: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="requiredPower"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Default Power"
							helperText="The normal amount of power this system will request in MegaWatts."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.defaultPower}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									defaultPower: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="defaultPower"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-4 flex">
						<Input
							labelHidden={false}
							label="Max Safe Power"
							helperText="The maximum recommended amount of power for this system in MegaWatts. Any additional power consumption will cause the system to sustain damage."
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							defaultValue={system.maxSafePower}
							onBlur={(e: any) => {
								if (Number.isNaN(Number(e.target.value))) return;
								q.plugin.systems.update.netSend({
									pluginId,
									systemId: systemId,
									shipId,
									shipPluginId,
									maxSafePower: Number(e.target.value),
								});
							}}
						/>
						<OverrideResetButton
							property="maxSafePower"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

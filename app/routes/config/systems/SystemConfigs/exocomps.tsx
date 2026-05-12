import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { toast } from "@thorium/context/ToastContext";
import Input from "@thorium/ui/Input";
import { capitalCase } from "change-case";
import { useContext, useReducer, type FocusEvent } from "react";
import { useParams } from "react-router";

import { OverrideResetButton } from "../OverrideResetButton";

export default function ExocompsConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.exocomps.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});
	const [rekey, setRekey] = useReducer(() => Math.random(), Math.random());
	const key = `${systemId}${rekey}`;

	function updateProperty(property: string) {
		return async (e: FocusEvent<HTMLInputElement>) => {
			if (!e.currentTarget.value || Number.isNaN(Number(e.currentTarget.value))) return;
			try {
				await q.plugin.systems.exocomps.update.netSend({
					pluginId,
					systemId,
					shipId,
					shipPluginId,
					[property]: Number(e.target.value),
				});
			} catch (err) {
				if (err instanceof Error) {
					toast({
						title: `Error changing ${capitalCase(property)}`,
						body: err.message,
						color: "error",
					});
				}
			}
		};
	}

	if (!system) return <Navigate to={`/config/${pluginId}/systems`} />;

	return (
		<fieldset key={key} className="flex-1 overflow-y-auto">
			<div className="flex flex-wrap">
				<div className="flex-1 pr-4">
					<div className="flex pb-2">
						<Input
							label="Exocomp Name"
							placeholder="Exocomp"
							helperText="The name the crew will see for the repair robots."
							defaultValue={system.exocompName}
							onBlur={updateProperty("exocompName")}
						/>
						<OverrideResetButton property="exocompName" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Count"
							placeholder="3"
							helperText="How many exocomps will be created with the ship."
							defaultValue={system.exocompCount}
							onBlur={updateProperty("exocompCount")}
						/>
						<OverrideResetButton property="exocompCount" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Max Charge"
							placeholder="0.5"
							helperText="How much energy the exocomps store in megawatt hours"
							defaultValue={system.exocompMaxCharge}
							onBlur={updateProperty("exocompMaxCharge")}
						/>
						<OverrideResetButton property="exocompMaxCharge" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Charge Rate"
							placeholder="2"
							helperText="The max rate exocomps can charge in megawatts. The actual rate is based on the power of the Exocomp system and how many exocomps are currently charging."
							defaultValue={system.exocompChargeRate}
							onBlur={updateProperty("exocompChargeRate")}
						/>
						<OverrideResetButton
							property="exocompChargeRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Idle Discharge Rate"
							placeholder="0.1"
							helperText="How fast exocomps discharge when they are not at their base in megawatts"
							defaultValue={system.exocompIdleDischargeRate}
							onBlur={updateProperty("exocompIdleDischargeRate")}
						/>
						<OverrideResetButton
							property="exocompIdleDischargeRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Working Discharge Rate"
							placeholder="1"
							helperText="How fast exocomps discharge when they are working in megawatts"
							defaultValue={system.exocompWorkingDischargeRate}
							onBlur={updateProperty("exocompWorkingDischargeRate")}
						/>
						<OverrideResetButton
							property="exocompWorkingDischargeRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Moving Discharge Rate"
							placeholder="0.2"
							helperText="How fast exocomps discharge when they are moving"
							defaultValue={system.exocompMovingDischargeRate}
							onBlur={updateProperty("exocompMovingDischargeRate")}
						/>
						<OverrideResetButton
							property="exocompMovingDischargeRate"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Movement Speed"
							placeholder="3"
							helperText="How fast exocomps move through the ship in meters per second."
							defaultValue={system.exocompMovementSpeed}
							onBlur={updateProperty("exocompMovementSpeed")}
						/>
						<OverrideResetButton
							property="exocompMovementSpeed"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="flex pb-2">
						<Input
							inputMode="numeric"
							pattern="[0-9]*"
							label="Exocomp Cargo Volume"
							placeholder="50"
							helperText="How much space the Exocomp can hold"
							defaultValue={system.exocompCargoVolume}
							onBlur={updateProperty("exocompCargoVolume")}
						/>
						<OverrideResetButton
							property="exocompCargoVolume"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

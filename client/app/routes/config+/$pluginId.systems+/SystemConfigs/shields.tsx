import { useParams } from "@remix-run/react";
import Input from "@thorium/ui/Input";
import { toast } from "@client/context/ToastContext";
import { useContext, useReducer } from "react";
import { ShipPluginIdContext } from "@client/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { q } from "@client/context/AppContext";
import { Navigate } from "@client/components/Navigate";
import Select from "@thorium/ui/Select";

export default function ShieldConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.shields.get.useNetRequest({
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
							label="Max Strength"
							placeholder={"5"}
							helperText={
								"The maximum strength of the shield when fully charged, in Megawatt Hours"
							}
							defaultValue={system.maxStrength}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.shields.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										maxStrength: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing max strength",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="maxStrength"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
					<div className="pb-2 flex">
						<div>
							<Select
								label="Shield Count"
								items={[
									{ id: 1, label: "1" },
									{ id: 4, label: "4" },
									{ id: 6, label: "6" },
								]}
								selected={system.shieldCount}
								setSelected={async (value) => {
									if (Array.isArray(value) || !value) return;
									try {
										await q.plugin.systems.shields.update.netSend({
											pluginId,
											systemId: systemId,
											shipId,
											shipPluginId,
											shieldCount: value,
										});
									} catch (err) {
										if (err instanceof Error) {
											toast({
												title: "Error changing shield count",
												body: err.message,
												color: "error",
											});
										}
									}
								}}
							/>
						</div>
						<OverrideResetButton
							property="shieldCount"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

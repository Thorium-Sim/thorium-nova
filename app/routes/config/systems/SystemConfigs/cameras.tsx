import { q } from "@thorium/context/AppContext";
import Input from "@thorium/ui/Input";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { Navigate } from "@thorium/components/Navigate";

export default function CamerasConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.cameras.get.useNetRequest({
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
					<div className="pb-2">
						<Input
							label="Viewscreen FOV"
							labelHidden={false}
							type="number"
							inputMode="numeric"
							min={10}
							max={120}
							defaultValue={system.fov}
							helperText="Vertical field of view for the viewscreen display (degrees)"
							onBlur={(e: any) => {
								const val = Number(e.target.value);
								if (!Number.isNaN(val) && val >= 10 && val <= 120) {
									q.plugin.systems.cameras.update.netSend({
										pluginId,
										systemId,
										shipId,
										shipPluginId,
										fov: val,
									});
								}
							}}
						/>
						<OverrideResetButton
							property="fov"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

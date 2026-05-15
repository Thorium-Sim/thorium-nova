import { Navigate } from "@thorium/components/Navigate";
import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import Checkbox from "@thorium/ui/Checkbox";
import { useContext, useReducer } from "react";
import { useParams } from "react-router";

import { OverrideResetButton } from "../OverrideResetButton";

export default function NavigationConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.navigation.get.useNetRequest({
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
						<Checkbox
							label="Calculate Course"
							defaultChecked={system.calculate}
							onChange={(event) =>
								q.plugin.systems.navigation.update.netSend({
									pluginId,
									systemId,
									shipId,
									shipPluginId,
									calculate: event.currentTarget.checked,
								})
							}
							helperText="Whether the crew can calculate a course from the navigation screen. Otherwise they need to use sensors to scan for a course. Mutually exclusive with the Thrusters option."
						/>
						<OverrideResetButton property="calculate" setRekey={setRekey} className="mt-6" />
					</div>
					<div className="pb-2">
						<Checkbox
							label="Thrusters Navigation"
							defaultChecked={system.thrusters}
							onChange={(event) =>
								q.plugin.systems.navigation.update.netSend({
									pluginId,
									systemId,
									shipId,
									shipPluginId,
									thrusters: event.currentTarget.checked,
								})
							}
							helperText="Calculating a course provides thrusters adjustments instead of coordinates. Mutually exclusive with Calculate Course option"
						/>
						<OverrideResetButton property="thrusters" setRekey={setRekey} className="mt-6" />
					</div>
				</div>
			</div>
		</fieldset>
	);
}

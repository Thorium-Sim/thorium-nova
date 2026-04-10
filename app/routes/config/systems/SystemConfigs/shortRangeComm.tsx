import { useParams } from "react-router";
import Input from "@thorium/ui/Input";
import { toast } from "@thorium/context/ToastContext";
import { useContext, useReducer } from "react";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { OverrideResetButton } from "../OverrideResetButton";
import { q } from "@thorium/context/AppContext";
import { Navigate } from "@thorium/components/Navigate";

export default function ShortRangeCommConfig() {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	const [system] = q.plugin.systems.shortRangeComm.get.useNetRequest({
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
					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Min Radius"
							placeholder={"10000"}
							helperText={
								"How far communications can connect when at minimum power"
							}
							defaultValue={system.minRadius}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.shortRangeComm.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										minRadius: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing min radius",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="minRange"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>

					<div className="pb-2 flex">
						<Input
							labelHidden={false}
							inputMode="numeric"
							pattern="[0-9]*"
							label="Max Range"
							placeholder={"1000000"}
							helperText={
								"How far communications can connect at maximum power."
							}
							defaultValue={system.maxRadius}
							onBlur={async (e) => {
								if (!e.target.value || Number.isNaN(Number(e.target.value)))
									return;
								try {
									await q.plugin.systems.shortRangeComm.update.netSend({
										pluginId,
										systemId: systemId,
										shipId,
										shipPluginId,
										maxRadius: Number(e.target.value),
									});
								} catch (err) {
									if (err instanceof Error) {
										toast({
											title: "Error changing max radius",
											body: err.message,
											color: "error",
										});
									}
								}
							}}
						/>
						<OverrideResetButton
							property="maxRadius"
							setRekey={setRekey}
							className="mt-6"
						/>
					</div>
				</div>
			</div>
		</fieldset>
	);
}

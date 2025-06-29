import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import { useParams } from "react-router";
import { useContext } from "react";
import { systemConfigs } from "../../systems/system";
import { q } from "@thorium/context/AppContext";

export default function SystemConfig() {
	const { systemId, shipId, pluginId } = useParams() as {
		systemId: string;
		shipId: string;
		pluginId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext)!;
	const [system] = q.plugin.systems.get.useNetRequest({
		pluginId,
		systemId,
		shipId,
		shipPluginId,
	});
	if (!system?.type) return null;
	const Comp = systemConfigs[system.type];
	if (!Comp) return null;
	return <Comp />;
}

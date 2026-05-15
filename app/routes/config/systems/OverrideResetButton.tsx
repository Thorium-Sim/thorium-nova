import { q } from "@thorium/context/AppContext";
import { ShipPluginIdContext } from "@thorium/context/ShipSystemOverrideContext";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { useContext } from "react";
import { useParams } from "react-router";

export function OverrideResetButton({
	property,
	setRekey,
	className = "",
}: {
	property: string;
	setRekey: () => void;
	className?: string;
}) {
	const { pluginId, systemId, shipId } = useParams() as {
		pluginId: string;
		systemId: string;
		shipId: string;
	};
	const shipPluginId = useContext(ShipPluginIdContext);

	if (!shipPluginId) return null;
	return (
		<Button
			title="Reset override"
			onClick={async () => {
				await q.plugin.systems.restoreOverride.netSend({
					pluginId,
					systemId: systemId,
					shipId,
					shipPluginId,
					property,
				});
				setRekey();
			}}
			className={`btn-sm btn-warning btn-outline ${className}`}
		>
			<Icon name="repeat-2" />
		</Button>
	);
}

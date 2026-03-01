import { useStation } from "@thorium/routes/station/useStation";
import { useShipWarnings, ShipWarning } from "@thorium/ui/ShipWarning";
import { useServerAlerts } from "@thorium/ui/useServerAlerts";

export function CollisionWarningGizmo({ className }: { className?: string }) {
	const { shipId } = useStation();
	const {
		showWarning,
		dismissWarning,
		displayedWarning,
		isEntering,
		isExiting,
		onEntryComplete,
		onExitComplete,
	} = useShipWarnings();
	useServerAlerts(shipId, showWarning, dismissWarning);

	return (
		<ShipWarning
			warning={displayedWarning}
			isEntering={isEntering}
			isExiting={isExiting}
			onEntryComplete={onEntryComplete}
			onExitComplete={onExitComplete}
			mode="inline"
			className={className}
		/>
	);
}

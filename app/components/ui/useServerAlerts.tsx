import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { q } from "@thorium/context/AppContext";
import { CollisionCountdown } from "@thorium/ui/CollisionCountdown";
import { useCardContext } from "@thorium/context/CardContext";
import type { ShipAlert } from "@thorium/ecs-components/shipAlerts";

type AlertContentRenderer = (alert: ShipAlert, cardLoaded: boolean) => ReactNode;

const alertRenderers: Record<string, AlertContentRenderer> = {
	collision: (alert, cardLoaded) => {
		return (
			<>
				Collision Warning — {alert.objectName} —{" "}
				<CollisionCountdown
					timeToCollision={alert.timeToCollision}
					baselineTimestamp={alert.baselineTimestamp}
					cardLoaded={cardLoaded}
				/>
			</>
		);
	},
};

function renderAlertContent(alert: ShipAlert, cardLoaded: boolean): ReactNode {
	const renderer = alertRenderers[alert.type];
	if (renderer) return renderer(alert, cardLoaded);
	return alert.message;
}

/**
 * Subscribes to server-side ship alerts and bridges them into
 * the useShipWarnings showWarning/dismissWarning API.
 */
export function useServerAlerts(
	shipId: number,
	showWarning: (entry: {
		id: string;
		priority: number;
		content: ReactNode;
		duration?: number;
	}) => void,
	dismissWarning: (id: string) => void,
) {
	const { cardLoaded } = useCardContext();
	const [data] = q.ship.shipAlerts.get.useNetRequest({ shipId });
	const prevAlertIdsRef = useRef(new Set<string>());

	useEffect(() => {
		const currentIds = new Set<string>();

		for (const alert of data.alerts) {
			currentIds.add(alert.id);
			showWarning({
				id: alert.id,
				priority: alert.priority,
				content: renderAlertContent(alert, cardLoaded),
				duration: alert.duration ?? undefined,
			});
		}

		// Dismiss alerts that were active before but are no longer present
		for (const prevId of prevAlertIdsRef.current) {
			if (!currentIds.has(prevId)) {
				dismissWarning(prevId);
			}
		}

		prevAlertIdsRef.current = currentIds;
	}, [data.alerts, showWarning, dismissWarning, cardLoaded]);
}

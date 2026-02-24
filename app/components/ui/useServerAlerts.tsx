import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { q } from "@thorium/context/AppContext";
import { CollisionCountdown } from "@thorium/ui/CollisionCountdown";
import { useCardContext } from "@thorium/context/CardContext";

type ServerAlert = {
	id: string;
	type: string;
	priority: number;
	message: string;
	duration: number | null;
	metadata: Record<string, unknown>;
};

type AlertContentRenderer = (alert: ServerAlert, cardLoaded: boolean) => ReactNode;

const alertRenderers: Record<string, AlertContentRenderer> = {
	collision: (alert, cardLoaded) => {
		const { objectName, timeToCollision, baselineTimestamp } =
			alert.metadata as {
				objectName: string;
				timeToCollision: number;
				baselineTimestamp: number;
			};
		return (
			<>
				COLLISION WARNING — {objectName} —{" "}
				<CollisionCountdown
					timeToCollision={timeToCollision}
					baselineTimestamp={baselineTimestamp}
					cardLoaded={cardLoaded}
				/>
			</>
		);
	},
};

function renderAlertContent(alert: ServerAlert, cardLoaded: boolean): ReactNode {
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
	const [data] = q.pilot.shipAlerts.get.useNetRequest({ shipId });
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

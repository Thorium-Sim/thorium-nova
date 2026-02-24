import type { Entity } from "@thorium/utils/ecs";
import { pubsub } from "@thorium/.server/init/pubsub";
import type { ShipAlert } from "@thorium/ecs-components/shipAlerts";

/**
 * Set or update a ship alert by id. If an alert with the same id already
 * exists it is replaced; otherwise a new alert is appended.
 */
export function setShipAlert(
	entity: Entity,
	alert: Omit<ShipAlert, "duration" | "metadata"> &
		Partial<Pick<ShipAlert, "duration" | "metadata">>,
) {
	const shipAlerts = entity.components.shipAlerts;
	if (!shipAlerts) return;

	const fullAlert: ShipAlert = {
		duration: null,
		metadata: {},
		...alert,
	};

	const idx = shipAlerts.alerts.findIndex(
		(a: ShipAlert) => a.id === alert.id,
	);
	if (idx !== -1) {
		shipAlerts.alerts[idx] = fullAlert;
	} else {
		shipAlerts.alerts.push(fullAlert);
	}
	entity.updateComponent("shipAlerts", { alerts: [...shipAlerts.alerts] });
	pubsub.publish.pilot.shipAlerts.get({ shipId: entity.id });
}

/**
 * Remove a ship alert by id. No-op if the alert doesn't exist.
 */
export function clearShipAlert(entity: Entity, alertId: string) {
	const shipAlerts = entity.components.shipAlerts;
	if (!shipAlerts) return;

	const idx = shipAlerts.alerts.findIndex(
		(a: ShipAlert) => a.id === alertId,
	);
	if (idx === -1) return;

	shipAlerts.alerts.splice(idx, 1);
	entity.updateComponent("shipAlerts", { alerts: [...shipAlerts.alerts] });
	pubsub.publish.pilot.shipAlerts.get({ shipId: entity.id });
}

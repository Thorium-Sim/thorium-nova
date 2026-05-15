import { pubsub } from "@thorium/.server/init/pubsub";
import type { ShipAlert } from "@thorium/ecs-components/shipAlerts";
import type { Entity } from "@thorium/utils/ecs";

/** Active duration timers keyed by `${entityId}:${alertId}` */
const durationTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Set or update a ship alert by id. If an alert with the same id already
 * exists it is replaced; otherwise a new alert is appended.
 *
 * When `duration` is non-null, a server-side timer auto-removes the alert
 * after that many milliseconds to prevent stale alerts from stacking up.
 */
export function setShipAlert(
	entity: Entity,
	alert: Omit<ShipAlert, "duration"> & Partial<Pick<ShipAlert, "duration">>,
) {
	const shipAlerts = entity.components.shipAlerts;
	if (!shipAlerts) return;

	const fullAlert: ShipAlert = {
		duration: null,
		...alert,
	};

	const idx = shipAlerts.alerts.findIndex((a: ShipAlert) => a.id === alert.id);
	if (idx !== -1) {
		shipAlerts.alerts[idx] = fullAlert;
	} else {
		shipAlerts.alerts.push(fullAlert);
	}
	entity.updateComponent("shipAlerts", { alerts: [...shipAlerts.alerts] });
	pubsub.publish.ship.shipAlerts.get({ shipId: entity.id });

	// Manage duration-based auto-removal
	const timerKey = `${entity.id}:${alert.id}`;
	const existingTimer = durationTimers.get(timerKey);
	if (existingTimer) {
		clearTimeout(existingTimer);
		durationTimers.delete(timerKey);
	}
	if (fullAlert.duration != null) {
		const timer = setTimeout(() => {
			durationTimers.delete(timerKey);
			clearShipAlert(entity, alert.id);
		}, fullAlert.duration);
		durationTimers.set(timerKey, timer);
	}
}

/**
 * Remove a ship alert by id. No-op if the alert doesn't exist.
 */
export function clearShipAlert(entity: Entity, alertId: string) {
	const shipAlerts = entity.components.shipAlerts;
	if (!shipAlerts) return;

	const idx = shipAlerts.alerts.findIndex((a: ShipAlert) => a.id === alertId);
	if (idx === -1) return;

	// Clean up any duration timer
	const timerKey = `${entity.id}:${alertId}`;
	const timer = durationTimers.get(timerKey);
	if (timer) {
		clearTimeout(timer);
		durationTimers.delete(timerKey);
	}

	shipAlerts.alerts.splice(idx, 1);
	entity.updateComponent("shipAlerts", { alerts: [...shipAlerts.alerts] });
	pubsub.publish.ship.shipAlerts.get({ shipId: entity.id });
}

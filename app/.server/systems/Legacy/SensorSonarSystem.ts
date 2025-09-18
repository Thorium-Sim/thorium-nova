import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";

export const activePingInterval = 6500;
const passivePingInterval = 15000;
export class LegacySensorSonarSystem extends System {
	static flightMode = ["legacy"];
	test(entity: Entity) {
		return !!entity.components.isLegacySensors;
	}
	update(entity: Entity, elapsed: number) {
		const sensors = entity?.components.isLegacySensors;
		if (!sensors) return;
		if (!sensors.pingActive) return;

		const pingInterval =
			sensors.pingMode === "active"
				? activePingInterval
				: sensors.pingMode === "passive"
					? passivePingInterval
					: Number.POSITIVE_INFINITY;
		let timeSincePing = sensors.timeSincePingMs + elapsed;
		if (timeSincePing >= pingInterval) {
			timeSincePing = 0;
			pubsub.publish.legacy.sensorGrid.sonarPing({
				shipId: entity.components.isShipSystem?.shipId || -1,
			});
		}
		if (timeSincePing >= passivePingInterval * 2) {
			timeSincePing = passivePingInterval;
		}
		entity.updateComponent("isLegacySensors", {
			timeSincePingMs: timeSincePing,
		});
	}
}

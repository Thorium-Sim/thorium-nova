import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";

export class LongRangeCommPowerSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isLongRangeComm && !!entity.components.power;
	}
	update(entity: Entity) {
		const power = entity.components.power;
		const longRangeComm = entity.components.isLongRangeComm;
		if (!power || !longRangeComm) return;

		const currentPower = power.currentPower;
		const requiredPower = power.powerLevels[0];
		const maxSafePower = power.powerLevels.at(-1)!;
		// Make sure the gain is set below its max
		const maxGain = Math.max(0, (currentPower - requiredPower) / (maxSafePower - requiredPower));

		if (longRangeComm.antennaGain > maxGain) {
			entity.updateComponent("isLongRangeComm", { antennaGain: maxGain });
			pubsub.publish.longRangeComm.get({
				shipId: entity.components.isShipSystem?.shipId || -1,
			});
		}
	}
}

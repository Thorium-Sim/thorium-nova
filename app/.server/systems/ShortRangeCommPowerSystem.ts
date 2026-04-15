import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";

export class ShortRangeCommPowerSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isShortRangeComm && !!entity.components.power;
	}
	update(entity: Entity) {
		const power = entity.components.power;
		const shortRangeComm = entity.components.isShortRangeComm;
		if (!power || !shortRangeComm) return;

		const currentPower = power.currentPower;
		const requiredPower = power.powerLevels[0];
		const maxSafePower = power.powerLevels.at(-1)!;
		// Make sure the gain is set below its max
		const maxGain = Math.max(
			0,
			(currentPower - requiredPower) / (maxSafePower - requiredPower),
		);

		if (["hailing", "connected"].includes(shortRangeComm.state)) {
			if (shortRangeComm.actualGain > maxGain) {
				entity.updateComponent("isShortRangeComm", { actualGain: maxGain });
				// TODO March 28, 2026: If gain goes below the required level for an active conversation
				// the ship should leave the conversation
				pubsub.publish.shortRangeComm.get({
					shipId: entity.components.isShipSystem?.shipId || -1,
				});
			}
		}
	}
}

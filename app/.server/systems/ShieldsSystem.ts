import { type Entity, System } from "@thorium/utils/ecs";

const SHIELD_DISCHARGE_TIME = 5 * 1000; // 5 seconds
export class ShieldsSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isShields;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;

		if (entity.components.power && entity.components.isShields) {
			const { currentPower, powerLevels } = entity.components.power;
			const requiredPower = powerLevels[0];
			const { state, maxStrength, strength } = entity.components.isShields;
			const efficiencyMultiplier = entity.components.damage?.efficiency ?? 1;
			// Some space magic to make the shields more powerful.
			// Increase this number to make shields recharge faster
			let strengthToRecharge = currentPower * efficiencyMultiplier * elapsedTimeHours * 10;
			if (state === "down" || currentPower < requiredPower) {
				// Quickly drain shields when they are down
				strengthToRecharge = (-maxStrength / SHIELD_DISCHARGE_TIME) * elapsed;
			}
			entity.updateComponent("isShields", {
				strength: Math.min(maxStrength, Math.max(0, strength + strengthToRecharge)),
			});
		}
	}
}

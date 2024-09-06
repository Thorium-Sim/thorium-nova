import { type Entity, System } from "../utils/ecs";

const SHIELD_DISCHARGE_TIME = 5 * 1000; // 5 seconds
export class ShieldsSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isShields;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;

		if (entity.components.power && entity.components.isShields) {
			const { currentPower } = entity.components.power;
			const { state, maxStrength, strength } = entity.components.isShields;
			let strengthToRecharge = currentPower * elapsedTimeHours * 10;
			if (state === "down") {
				// Quickly drain shields when they are down
				strengthToRecharge = (-maxStrength / SHIELD_DISCHARGE_TIME) * elapsed;
			}

			entity.updateComponent("isShields", {
				strength: Math.min(
					maxStrength,
					Math.max(0, strength + strengthToRecharge),
				),
			});
		}
	}
}

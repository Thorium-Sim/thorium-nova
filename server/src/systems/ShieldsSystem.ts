import { type Entity, System } from "../utils/ecs";

export class ShieldsSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isShields;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;

		if (entity.components.power && entity.components.isShields) {
			const { currentPower } = entity.components.power;
			const { state, maxStrength, strength } = entity.components.isShields;
			if (state === "down") return;
			const strengthToRecharge = currentPower * elapsedTimeHours;
			entity.updateComponent("isShields", {
				strength: Math.min(
					maxStrength,
					Math.max(0, strength + strengthToRecharge),
				),
			});
		}
	}
}

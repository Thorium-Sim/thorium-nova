import { type Entity, System } from "@thorium/utils/ecs";

const coolRate = 0.15;
const heatRemoveRate = 0.3;

export class LegacyCoolantSystem extends System {
	static flightMode = ["legacy"];
	test(entity: Entity) {
		return !!entity.components.legacyCoolant;
	}
	update(entity: Entity, elapsed: number) {
		const elapsedRatio = elapsed / 1000;

		const coolant = entity.components.legacyCoolant;
		const heat = entity.components.heat;
		if (!coolant || !heat) return;
		if (
			coolant.cooling &&
			coolant.coolant > 0 &&
			heat.heat > heat.nominalHeat
		) {
			const heatAdjustment = heat.maxHeat - heat.nominalHeat;
			const newCoolant = Math.min(
				1,
				Math.max(
					0,
					coolant.coolant -
						coolRate * elapsedRatio * coolant.coolantConsumptionRate,
				),
			);
			entity.updateComponent("legacyCoolant", {
				coolant: newCoolant,
			});
			const newHeat = Math.max(
				heat.nominalHeat,
				Math.min(
					heat.maxHeat,
					heat.heat - heatRemoveRate * heatAdjustment * elapsedRatio,
				),
			);
			entity.updateComponent("heat", {
				heat: newHeat,
			});
			if (newHeat <= heat.nominalHeat || newCoolant <= 0) {
				entity.updateComponent("legacyCoolant", { cooling: false });
			}
		}
	}
}

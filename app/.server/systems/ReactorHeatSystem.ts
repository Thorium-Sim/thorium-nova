import { type Entity, System } from "@thorium/utils/ecs";
import type { MegaWatt } from "@thorium/utils/unitTypes";

// TODO May 28, 2026 — If the net reactor output is greater than 0, pump all
// of that extra energy into heat.
export class ReactorHeatSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isReactor && !!entity.components.heat;
	}
	update(entity: Entity) {
		if (!entity.components.isReactor || !entity.components.heat) return;
		const { currentOutput, balanced, balancedBonusMultiplier } = entity.components.isReactor;
		const { powerToHeat } = entity.components.heat;
		const { heatMultiplier } = entity.components.damage || { heatMultiplier: 1 };

		const heatGenerated: MegaWatt =
			currentOutput * powerToHeat * (balanced ? balancedBonusMultiplier : 1) * heatMultiplier;

		entity.updateComponent("heat", { heatLoad: heatGenerated });
	}
}

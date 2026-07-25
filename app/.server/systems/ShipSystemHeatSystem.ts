import { type Entity, System } from "@thorium/utils/ecs";
import type { MegaWatt } from "@thorium/utils/unitTypes";

export class ShipSystemHeatSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return (
			!!entity.components.isShipSystem && !!entity.components.heat && !!entity.components.power
		);
	}
	update(entity: Entity) {
		if (!entity.components.isShipSystem || !entity.components.heat || !entity.components.power)
			return;
		// Reactors are handled on their own ECS system.
		if (entity.components.isReactor) return;
		const { powerToHeat } = entity.components.heat;
		const { currentPower } = entity.components.power;
		const { heatMultiplier } = entity.components.damage || { heatMultiplier: 1 };

		const heatGenerated: MegaWatt = currentPower * powerToHeat * heatMultiplier;

		entity.updateComponent("heat", { heatLoad: heatGenerated });
	}
}

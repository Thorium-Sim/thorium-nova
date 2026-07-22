import { getReactorInventory } from "@thorium/utils/.server/ship/getSystemInventory";
import { type Entity, System } from "@thorium/utils/ecs";
import { type MeterSquared, StephanBoltzmannConstant as _ } from "@thorium/utils/unitTypes";

// W = A * a * T^5
// W = Watts
// A = area of radiator
// σ = Stefan-Boltzmann constant
// T^4 = radiator temperature
// Increasing it by another power as
// space magic.

// For transferring the heat of the coolant
// into watts
// 𝚫T = (W * 𝚫t) / (c * m)
// 𝚫t = change in time
// c = specific heat
// m = mass
// 𝚫T = change in temperature

// Specific heat is in J/gK, 1J = 1 wattsecond

const _RADIATOR_AREA: MeterSquared = 1;

export class HeatDispersionSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.heat;
	}
	update(entity: Entity, elapsed: number) {
		const _elapsedInSeconds = elapsed / 1000;
		if (!entity.components.heat) return;
		const inventory = getReactorInventory(entity) || [];
		// Radiate the heat of the coolant into space
		for (const item of inventory) {
			if (!item.flags?.coolant) continue;
			// const wattsDispersed = RADIATOR_AREA * StephanBoltzmannConstant * temp ** 5;

			// const tempDrop =
			// 	(wattsDispersed * elapsedInSeconds) /
			// 	(item.flags.coolant.heatCapacity * item.flags.coolant.massPerUnit * 1000 * item.count);
			// if (item.room) {
			// 	item.room.contents[item.name].temperature = Math.max(2.7, temp - tempDrop);
			// }
		}
	}
}

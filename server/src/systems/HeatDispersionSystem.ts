import {getReactorInventory} from "@server/utils/getSystemInventory";
import {type MeterSquared, StephanBoltzmannConstant} from "@server/utils/unitTypes";
import {type Entity, System} from "../utils/ecs";

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

const RADIATOR_AREA: MeterSquared = 1;

export class HeatDispersionSystem extends System {
  test(entity: Entity) {
    return !!entity.components.heat;
  }
  update(entity: Entity, elapsed: number) {
    const elapsedInSeconds = elapsed / 1000;
    if (!entity.components.heat) return;
    const inventory = getReactorInventory(entity) || [];
    // Radiate the heat of the coolant into space
    for (const item of inventory) {
      if (!item.flags?.coolant) continue;
      const temp = item.temperature;
      const wattsDispersed =
        RADIATOR_AREA * StephanBoltzmannConstant * temp ** 5;

      const tempDrop =
        (wattsDispersed * elapsedInSeconds) /
        (item.flags.coolant.heatCapacity *
          item.flags.coolant.massPerUnit *
          1000 *
          item.count);
      if (item.room) {
        item.room.contents[item.name].temperature = Math.max(
          2.7,
          temp - tempDrop
        );
      }
    }
  }
}

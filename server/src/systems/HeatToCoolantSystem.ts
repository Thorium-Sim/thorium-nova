import {getReactorInventory} from "@server/utils/getSystemInventory";
import {
  type 
  HeatCapacity,
  Kelvin,
  type 
  Kilograms,
  MegaWatt,
  MegaWattHour,
  type 
  MeterSquared,
  StephanBoltzmannConstant,
} from "@server/utils/unitTypes";
import {type Entity, System} from "../utils/ecs";

// For transferring the heat of the coolant
// into watts
// 𝚫T = (W * 𝚫t) / (c * m)
// W = (c * m * 𝚫T) / 𝚫t
// 𝚫t = change in time
// c = specific heat
// m = mass
// 𝚫T = change in temperature

// Specific heat is in J/gK, 1J = 1 wattsecond

// Assumed values for the systems
const HEAT_CAPACITY: HeatCapacity = 0.475;
const MASS: Kilograms = 10000;
const COOLANT_AREA: MeterSquared = 1;
const THERMAL_CONDUCTIVITY = 46.6; // W/(mK)
const THERMAL_DISTANCE = 1e-3;
export class HeatToCoolantSystem extends System {
  test(entity: Entity) {
    return !!entity.components.heat;
  }
  update(entity: Entity, elapsed: number) {
    const elapsedInSeconds = elapsed / 1000;
    if (!entity.components.heat) return;
    const inventory = getReactorInventory(entity) || [];

    // Transfer heat between the system and the coolant
    // We do this by converting the heat of each thing
    // into watts, averaging them, then converting them
    // back into temperature and assigning them to their
    // respective thing.
    let systemWatts =
      (HEAT_CAPACITY * MASS * 1000 * entity.components.heat.heat) /
      elapsedInSeconds;

    for (const item of inventory) {
      if (!item.flags?.coolant) continue;
      let itemWatts =
        (item.flags.coolant.heatCapacity *
          item.flags.coolant.massPerUnit *
          1000 *
          item.count *
          item.temperature) /
        elapsedInSeconds;
      const tempDifference = entity.components.heat.heat - item.temperature;
      const heatTransferRate =
        -1 *
        THERMAL_CONDUCTIVITY *
        COOLANT_AREA *
        (tempDifference / THERMAL_DISTANCE);
      systemWatts += heatTransferRate;
      itemWatts -= heatTransferRate;

      const itemTemp =
        (itemWatts * elapsedInSeconds) /
        (item.flags.coolant.heatCapacity *
          item.flags.coolant.massPerUnit *
          1000 *
          item.count);
      if (item.room) {
        item.room.contents[item.name].temperature = itemTemp;
      }
    }

    const systemTemp =
      (systemWatts * elapsedInSeconds) / (HEAT_CAPACITY * MASS * 1000);
    entity.components.heat.heat = systemTemp;
  }
}

import {getReactorInventory} from "@server/utils/getSystemInventory";
import {
  type 
  HeatCapacity,
  type 
  Kelvin,
  type 
  Kilograms,
  type 
  MegaWatt,
  MegaWattHour,
} from "@server/utils/unitTypes";
import {type Entity, System} from "../utils/ecs";

// W = Q / 𝚫t = (c * m * 𝚫T)/𝚫t
// W = watts
// Q = Energy Added (watthour)
// 𝚫t = change in time
// c = specific heat
// m = mass
// 𝚫T = change in temperature
// So, based on this
// 𝚫T = (W * 𝚫t) / (c * m)
// For now, assume c = 0.52, the specific heat of titanium
// And the mass of the reactor is 10000kg

// Specific heat is in J/gK, 1 J = 1 wattsecond

const HEAT_CAPACITY: HeatCapacity = 0.475;
const MASS: Kilograms = 10000;

export class ReactorHeatSystem extends System {
  test(entity: Entity) {
    return !!entity.components.isReactor && !!entity.components.heat;
  }
  update(entity: Entity, elapsed: number) {
    const elapsedInSeconds = elapsed / 1000;
    if (!entity.components.isReactor || !entity.components.heat) return;
    const {currentOutput} = entity.components.isReactor;
    const {powerToHeat} = entity.components.heat;

    const heatGenerated: MegaWatt = currentOutput * powerToHeat;

    const heatInWatts = heatGenerated * 1e6;

    const changeInHeat: Kelvin =
      (heatInWatts * elapsedInSeconds) / (HEAT_CAPACITY * MASS * 1000);

    entity.components.heat.heat += changeInHeat;
  }
}

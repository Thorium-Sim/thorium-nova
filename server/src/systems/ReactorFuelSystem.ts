import {getReactorInventory} from "@server/utils/getSystemInventory";
import {
  MegaWatt,
  MegaWattHour,
  megaWattHourToMegaWattSecond,
} from "@server/utils/unitTypes";
import {Entity, System} from "../utils/ecs";

export class ReactorFuelSystem extends System {
  test(entity: Entity) {
    return !!entity.components.isReactor;
  }
  update(entity: Entity, elapsed: number) {
    if (!entity.components.isReactor) return;
    const efficiency = entity.components.efficiency?.efficiency ?? 1;
    if (efficiency === 0) {
      entity.updateComponent("isReactor", {
        currentOutput: 0,
      });
      return;
    }

    const {
      desiredOutput: powerNeeded,
      optimalOutputPercent,
      maxOutput,
    } = entity.components.isReactor;

    const optimalOutput = maxOutput * optimalOutputPercent;
    const outputBonus = powerNeeded / optimalOutput;
    // E(mWh) = P(mW) * T(h)
    const elapsedTimeHours = elapsed / 1000 / 60 / 60;
    const energyNeeded: MegaWattHour =
      powerNeeded * elapsedTimeHours * outputBonus * (1 / efficiency);

    // Reduce energyNeeded by the unused fuel
    const unusedFuelEnergy: MegaWattHour =
      entity.components.isReactor.unusedFuel.amount *
      entity.components.isReactor.unusedFuel.density;
    let energyProvided = unusedFuelEnergy;
    if (energyNeeded - energyProvided < 0) {
      entity.components.isReactor.unusedFuel.amount =
        Math.abs(energyNeeded - energyProvided) /
        entity.components.isReactor.unusedFuel.density;
      entity.components.isReactor.currentOutput =
        entity.components.isReactor.desiredOutput;
      return;
    }
    entity.components.isReactor.unusedFuel.amount = 0;

    const fuel =
      getReactorInventory(entity)?.filter(item => item.flags.fuel) || [];

    // // Pick the fuel item with the highest energy density
    const toBurn = fuel.reduce((prev: null | (typeof fuel)[0], next) => {
      if (
        (next.flags.fuel?.fuelDensity || -1) >
        (prev?.flags.fuel?.fuelDensity || -1)
      )
        return next;
      return prev;
    }, null);

    // More Fuel!
    if (toBurn?.flags.fuel?.fuelDensity && toBurn?.count) {
      entity.components.isReactor.unusedFuel.density =
        toBurn.flags.fuel.fuelDensity;
      let fuelUnitsNeeded = Math.ceil(
        energyNeeded / toBurn.flags.fuel.fuelDensity
      );
      let fuelRemaining =
        (toBurn.room?.contents[toBurn.name].count || 0) - fuelUnitsNeeded;

      if (fuelRemaining < 0) {
        fuelUnitsNeeded = toBurn.room?.contents[toBurn.name].count || 0;
        fuelRemaining = 0;
      }
      if (toBurn.room) {
        toBurn.room.contents[toBurn.name].count = fuelRemaining;
      }

      energyProvided = fuelUnitsNeeded * toBurn.flags.fuel.fuelDensity;

      if (energyNeeded - energyProvided < 0) {
        entity.components.isReactor.unusedFuel.amount =
          Math.abs(energyNeeded - energyProvided) /
          entity.components.isReactor.unusedFuel.density;
        entity.components.isReactor.currentOutput =
          entity.components.isReactor.desiredOutput;
        return;
      }
    }
    // Figure out the current power output based on how much power has been provided
    const powerProvided: MegaWatt =
      energyProvided / elapsedTimeHours / outputBonus;
    entity.components.isReactor.currentOutput = powerProvided;
  }
}

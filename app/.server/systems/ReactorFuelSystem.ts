import { getReactorInventory } from "@thorium/utils/.server/ship/getSystemInventory";
import { type Entity, System } from "@thorium/utils/ecs";
import type { MegaWatt, MegaWattHour } from "@thorium/utils/unitTypes";

export class ReactorFuelSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!entity.components.isReactor;
	}
	update(entity: Entity, elapsed: number) {
		if (!entity.components.isReactor) return;
		const efficiency = entity.components.damage?.efficiency ?? 1;
		const elapsedTimeHours = elapsed / 1000 / 60 / 60;

		if (efficiency === 0) {
			entity.updateComponent("isReactor", {
				currentOutput: 0,
			});
			return;
		}

		const {
			optimalOutputPercent,
			balanced,
			balancedBonusMultiplier,
			currentOutput,
			unusedFuel,
			maxOutput,
		} = entity.components.isReactor;

		const optimalOutput = maxOutput * optimalOutputPercent;
		const outputBonus =
			Math.max(currentOutput / optimalOutput, 0.5) * (balanced ? balancedBonusMultiplier : 1);

		// E(mWh) = P(mW) * T(h)
		const energyNeeded: MegaWattHour =
			currentOutput * elapsedTimeHours * outputBonus * (1 / efficiency);

		// Reduce energyNeeded by the unused fuel
		const unusedFuelEnergy: MegaWattHour = unusedFuel.amount * unusedFuel.density;
		let energyProvided = unusedFuelEnergy;
		if (energyNeeded - energyProvided < 0) {
			entity.updateComponent("isReactor", {
				unusedFuel: {
					amount: Math.abs(energyNeeded - energyProvided) / unusedFuel.density,
					density: unusedFuel.density,
				},
			});
			return;
		}

		entity.updateComponent("isReactor", {
			unusedFuel: {
				density: entity.components.isReactor.unusedFuel.density,
				amount: 0,
			},
		});

		const fuel = getReactorInventory(entity)?.filter((item) => item.flags.fuel) || [];

		// // Pick the fuel item with the highest energy density
		const toBurn = fuel.reduce((prev: null | (typeof fuel)[0], next) => {
			if ((next.flags.fuel?.fuelDensity || -1) > (prev?.flags.fuel?.fuelDensity || -1)) return next;
			return prev;
		}, null);

		// More Fuel!
		if (toBurn?.flags.fuel?.fuelDensity && toBurn?.count) {
			entity.updateComponent("isReactor", {
				unusedFuel: {
					amount: 0,
					density: toBurn.flags.fuel.fuelDensity,
				},
			});

			let fuelUnitsNeeded = Math.ceil(energyNeeded / toBurn.flags.fuel.fuelDensity);
			let fuelRemaining = (toBurn.room?.contents[toBurn.name].count || 0) - fuelUnitsNeeded;

			if (fuelRemaining < 0) {
				fuelUnitsNeeded = toBurn.room?.contents[toBurn.name].count || 0;
				fuelRemaining = 0;
			}
			if (toBurn.room) {
				toBurn.room.contents[toBurn.name].count = fuelRemaining;
			}

			energyProvided = fuelUnitsNeeded * toBurn.flags.fuel.fuelDensity;

			if (energyNeeded - energyProvided < 0) {
				entity.updateComponent("isReactor", {
					unusedFuel: {
						amount: Math.abs(energyNeeded - energyProvided) / toBurn.flags.fuel.fuelDensity,
						density: toBurn.flags.fuel.fuelDensity,
					},
				});

				return;
			}
		}
		// Figure out the current power output based on how much power has been provided
		const powerProvided: MegaWatt = energyProvided / elapsedTimeHours / outputBonus;

		entity.updateComponent("isReactor", { currentOutput: powerProvided });
	}
}

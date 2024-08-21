import { getReactorInventory } from "@server/utils/getSystemInventory";
import type { MegaWatt, MegaWattHour } from "@server/utils/unitTypes";
import { type Entity, System } from "../utils/ecs";

export function getPowerSupplierPowerNeeded(entity: Entity) {
	if (!entity.components.isReactor && !entity.components.isBattery) return 0;
	const shipId = entity.components.isShipSystem?.shipId;
	const systems = [];
	for (const system of entity.ecs?.componentCache.get("power") || []) {
		if (system.components.isShipSystem?.shipId === shipId) {
			systems.push(system);
		}
	}
	for (const system of entity.ecs?.componentCache.get("isBattery") || []) {
		if (system.components.isShipSystem?.shipId === shipId) {
			systems.push(system);
		}
	}

	return systems.reduce((prev, next) => {
		return (
			prev +
			(next.components.power?.powerSources.reduce(
				(prev, next) => prev + (next === entity.id ? 1 : 0),
				0,
			) || 0) +
			(next.components.isBattery?.powerSources.reduce(
				(prev, next) => prev + (next === entity.id ? 1 : 0),
				0,
			) || 0)
		);
	}, 0);
}
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

		const { optimalOutputPercent, maxOutput } = entity.components.isReactor;

		const powerNeeded = getPowerSupplierPowerNeeded(entity);

		const optimalOutput = maxOutput * optimalOutputPercent;
		const outputBonus = Math.max(powerNeeded / optimalOutput, 0.5);

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
			entity.components.isReactor.currentOutput = powerNeeded;
			return;
		}
		entity.components.isReactor.unusedFuel.amount = 0;

		const fuel =
			getReactorInventory(entity)?.filter((item) => item.flags.fuel) || [];

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
				energyNeeded / toBurn.flags.fuel.fuelDensity,
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
				entity.components.isReactor.currentOutput = powerNeeded;
				return;
			}
		}
		// Figure out the current power output based on how much power has been provided
		const powerProvided: MegaWatt =
			energyProvided / elapsedTimeHours / outputBonus;

		entity.components.isReactor.currentOutput = powerProvided;
	}
}

import { pubsub } from "@server/init/pubsub";
import { t } from "@server/init/t";
import { getPowerSupplierPowerNeeded } from "@server/systems/ReactorFuelSystem";
import type { Entity } from "@server/utils/ecs";
import { getShipSystems } from "@server/utils/getShipSystem";
import { getReactorInventory } from "@server/utils/getSystemInventory";
import type { MegaWattHour } from "@server/utils/unitTypes";
import { z } from "zod";

export const systemsMonitor = t.router({
	reactors: t.router({
		get: t.procedure
			.filter((publish: { shipId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				const reactors = getShipSystems(ctx, { systemType: "reactor" });
				return reactors.map((r) => {
					const inventory = getReactorInventory(r);
					const fuelPower: MegaWattHour =
						inventory?.reduce((prev, next) => {
							return prev + (next.flags.fuel?.fuelDensity || 0) * next.count;
						}, 0) || 0;
					const output = r.components.isReactor!.currentOutput;
					// The reserve is considered full if we can maintain the current output
					// for one hour
					const reserve = Math.min(
						1,
						Math.max(0, fuelPower / (output || Number.EPSILON)),
					);

					return {
						id: r.id,
						name: r.components.identity!.name,
						desiredOutput: getPowerSupplierPowerNeeded(r),
						maxOutput: r.components.isReactor!.maxOutput,
						optimalOutputPercent: r.components.isReactor!.optimalOutputPercent,
						nominalHeat: r.components.heat!.nominalHeat,
						maxSafeHeat: r.components.heat!.maxSafeHeat,
						maxHeat: r.components.heat!.maxHeat,
						reserve,
						fuel: r.components.isReactor!.unusedFuel.amount || 0,
						efficiency: r.components.efficiency?.efficiency,
					};
				});
			}),
	}),
	batteries: t.router({
		get: t.procedure
			.filter((publish: { shipId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				const batteries = getShipSystems(ctx, { systemType: "battery" });
				return batteries.map((b) => ({
					id: b.id,
					name: b.components.identity!.name,
					desiredOutput: getPowerSupplierPowerNeeded(b),
					capacity: b.components.isBattery!.capacity,
					storage: b.components.isBattery!.storage,
					chargeAmount: b.components.isBattery!.chargeAmount,
					chargeRate: b.components.isBattery!.chargeRate,
					outputAmount: b.components.isBattery!.outputAmount,
					outputRate: b.components.isBattery!.outputRate,
					powerSources: b.components.isBattery!.powerSources,
				}));
			}),
	}),

	systems: t.router({
		get: t.procedure
			.filter((publish: { shipId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				const systems = [];
				for (const systemId of ctx.ship?.components.shipSystems?.shipSystems.keys() ||
					[]) {
					const system = ctx.flight?.ecs.getEntityById(systemId);
					if (!system?.components.isShipSystem) continue;
					// Filter out reactors and batteries
					if (system.components.isReactor || system.components.isBattery)
						continue;
					systems.push({
						id: systemId,
						name: system.components.identity!.name,
						power: system.components.power
							? {
									maxSafePower: system.components.power.maxSafePower,
									requiredPower: system.components.power.requiredPower,
									powerSources: system.components.power.powerSources,
							  }
							: undefined,

						efficiency: system.components.efficiency?.efficiency,
						heat: system.components.heat
							? {
									heat: system.components.heat.heat,
									maxHeat: system.components.heat.maxHeat,
									maxSafeHeat: system.components.heat.maxSafeHeat,
									nominalHeat: system.components.heat.nominalHeat,
							  }
							: undefined,
					});
				}

				return systems;
			}),
		removePowerSource: t.procedure
			.input(
				z.object({
					systemId: z.number(),
					powerSourceIndex: z.number(),
				}),
			)
			.send(({ input, ctx }) => {
				const system = ctx.flight?.ecs.getEntityById(input.systemId);

				const shipId = system?.components.isShipSystem?.shipId;
				if (!shipId) return;

				if (system.components.power) {
					const newPowerSources = [
						...(system?.components.power.powerSources || []),
					];
					newPowerSources.splice(input.powerSourceIndex, 1);
					system.updateComponent("power", {
						powerSources: newPowerSources,
					});
				}
				if (system.components.isBattery) {
					const newPowerSources = [
						...(system?.components.isBattery.powerSources || []),
					];
					newPowerSources.splice(input.powerSourceIndex, 1);
					system.updateComponent("isBattery", {
						powerSources: newPowerSources,
					});
				}

				pubsub.publish.systemsMonitor.systems.get({ shipId });
				pubsub.publish.systemsMonitor.reactors.get({ shipId });
				pubsub.publish.systemsMonitor.batteries.get({ shipId });
			}),
		addPowerSource: t.procedure
			.input(
				z.object({
					systemId: z.number(),
					powerSourceId: z.number(),
				}),
			)
			.send(({ input, ctx }) => {
				const system = ctx.flight?.ecs.getEntityById(input.systemId);

				const shipId = system?.components.isShipSystem?.shipId;
				if (!shipId) return;

				const powerSource = ctx.flight?.ecs.getEntityById(input.powerSourceId);
				if (!powerSource)
					throw new Error(
						"Invalid power source. Power source must be a reactor or battery.",
					);
				const powerSupplied = getPowerSupplierPowerNeeded(powerSource);

				if (
					powerSource.components.isReactor &&
					powerSource.components.isReactor?.maxOutput < powerSupplied + 1
				) {
					throw new Error("Reactor is at maximum output.");
				}
				if (
					powerSource.components.isBattery &&
					powerSource.components.isBattery.outputRate < powerSupplied + 1
				) {
					throw new Error("Battery is at maximum output.");
				}

				if (system.components.power) {
					const newPowerSources = [
						...(system?.components.power?.powerSources || []),
						input.powerSourceId,
					];

					system.updateComponent("power", {
						powerSources: newPowerSources,
					});
				} else if (system.components.isBattery) {
					const newPowerSources = [
						...(system?.components.isBattery?.powerSources || []),
						input.powerSourceId,
					].slice(0, system.components.isBattery.chargeRate);
					system.updateComponent("isBattery", {
						powerSources: newPowerSources,
					});
				}

				pubsub.publish.systemsMonitor.systems.get({ shipId });
				pubsub.publish.systemsMonitor.reactors.get({ shipId });
				pubsub.publish.systemsMonitor.batteries.get({ shipId });
			}),
	}),
	stream: t.procedure.dataStream(({ ctx, entity }) => {
		if (!entity) return false;
		return Boolean(
			ctx.ship?.components.shipSystems?.shipSystems.has(entity.id) &&
				(entity.components.power ||
					entity.components.isBattery ||
					entity.components.isReactor),
		);
	}),
});

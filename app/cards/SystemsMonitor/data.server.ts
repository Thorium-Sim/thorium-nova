import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getPowerSupplierPowerNeeded } from "@thorium/.server/systems/ReactorFuelSystem";
import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { getReactorInventory } from "@thorium/utils/.server/ship/getSystemInventory";
import type { MegaWattHour } from "@thorium/utils/unitTypes";
import { z } from "zod";

export const systemsMonitor = t.router({
	reactors: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { ctx, input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isReactor"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
					},
			)

			.request(({ ctx, input: { shipId } }) => {
				if (!ctx.flight) return [];

				const reactors = getShipSystems(ctx.flight.ecs, {
					systemType: "reactor",
					shipId,
				});
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
						ambiance: r.components.soundEffects?.soundBank.ambiance,
					};
				});
			}),
		ambiance: t.procedure
			.input(z.object({ shipId: z.number() }))
			.autoPublish([], () => null)

			.request(({ ctx, input }) => {
				if (!ctx.flight) return [];

				const reactors = getShipSystems(ctx.flight.ecs, {
					systemType: "reactor",
					shipId: input.shipId,
				});

				return reactors.map((r) => ({
					id: r.id,
					// Reactor volume is based on the ratio of the current output to the max output
					volumePercent:
						r.components.isReactor!.currentOutput /
						r.components.isReactor!.maxOutput,
					playbackRate: 1,
					ambiance: r.components.soundEffects?.soundBank.ambiance,
				}));
			}),
	}),
	batteries: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { ctx, input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isBattery"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
					},
			)

			.request(({ ctx, input }) => {
				if (!ctx.flight) return [];

				const batteries = getShipSystems(ctx.flight.ecs, {
					systemType: "battery",
					shipId: input.shipId,
				});
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
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { ctx, input }) => {
				if (publish && publish.shipId !== input.shipId) return false;
				return true;
			})
			.autoPublish(
				["isShipSystem"],
				(entity) =>
					entity.components.isShipSystem && {
						shipId: entity.components.isShipSystem.shipId,
					},
			)

			.request(({ ctx, input }) => {
				const systems = [];
				const ship = ctx.ecs.getEntityById(input.shipId);
				for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
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

				if (system.components.isPhasers) {
					// Update the output megawatts of the phasers
					pubsub.publish.targeting.phasers.list({ shipId });
				}
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

				if (
					system.components.isPhasers &&
					!powerSource.components.isPhaseCapacitor
				) {
					throw new Error(
						"Invalid power source. Power source must be a phase capacitor.",
					);
				}

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

				if (system.components.isPhasers) {
					// Update the output megawatts of the phasers
					pubsub.publish.targeting.phasers.list({ shipId });
				}
			}),
	}),
	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ input, entity }) => {
			if (!entity) return false;
			return Boolean(
				entity.components.isShipSystem?.shipId === input.shipId &&
					(entity.components.power ||
						entity.components.isBattery ||
						entity.components.isReactor),
			);
		}),
});

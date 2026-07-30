import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getRoomBySystem } from "@thorium/cards/CargoControl/data.server";
import type { ShipSystemTypes } from "@thorium/ecs-components/shipSystems";
import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { getReactorInventory } from "@thorium/utils/.server/ship/getSystemInventory";
import type { Entity } from "@thorium/utils/ecs";
import type { MegaWattHour } from "@thorium/utils/unitTypes";
import z from "zod";

export const systemsMonitor = t.router({
	reactors: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { input }) => {
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
				return reactors.flatMap((r) => {
					if (!r) return [];
					const inventory = getReactorInventory(r);
					const fuelPower: MegaWattHour =
						inventory?.reduce((prev, next) => {
							return prev + (next.flags.fuel?.fuelDensity || 0) * next.count;
						}, 0) || 0;
					const output = r.components.isReactor!.currentOutput;
					// The reserve is considered full if we can maintain the current output
					// for one hour
					const reserve = Math.min(1, Math.max(0, fuelPower / (output || Number.EPSILON)));
					try {
						return {
							id: r.id,
							name: r.components.identity!.name,
							desiredOutput: r.components.isReactor!.desiredOutput,
							maxOutput: r.components.isReactor!.maxOutput,
							optimalOutputPercent: r.components.isReactor!.optimalOutputPercent,
							nominalHeat: r.components.heat!.nominalHeat,
							maxSafeHeat: r.components.heat!.maxSafeHeat,
							maxHeat: r.components.heat!.maxHeat,
							reserve,
							fuel: r.components.isReactor!.unusedFuel.amount || 0,
							efficiency: r.components.damage?.efficiency,
							ambiance: r.components.soundEffects?.soundBank.ambiance,
						};
					} catch {
						return [];
					}
				});
			}),
		setDesiredOutput: t.procedure
			.input(z.object({ reactorId: z.number(), output: z.number() }))
			.send(({ ctx, input }) => {
				const reactor = ctx.ecs.getEntityById(input.reactorId);
				if (!reactor?.components.isReactor) throw new Error("Reactor not found.");
				reactor.updateComponent("isReactor", {
					desiredOutput: Math.max(
						0,
						Math.min(reactor.components.isReactor.maxOutput, input.output),
					),
				});

				pubsub.publish.systemsMonitor.reactors.get({
					shipId: reactor.components.isShipSystem?.shipId || -1,
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
					volumePercent: r.components.isReactor!.currentOutput / r.components.isReactor!.maxOutput,
					playbackRate: 1,
					ambiance: r.components.soundEffects?.soundBank.ambiance,
				}));
			}),
	}),
	batteries: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { input }) => {
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
					capacity: b.components.isBattery!.capacity,
					storage: b.components.isBattery!.storage,
					chargeAmount: b.components.isBattery!.chargeAmount,
					chargeRate: b.components.isBattery!.chargeRate,
					outputAmount: b.components.isBattery!.outputAmount,
					outputRate: b.components.isBattery!.outputRate,
					activated: b.components.isBattery!.powerActivated,
				}));
			}),
		setStorage: t.procedure
			.input(z.object({ batteryId: z.number(), storagePercent: z.number() }))
			.meta({ action: true })
			.send(({ ctx, input }) => {
				const battery = ctx.ecs.getEntityById(input.batteryId);
				battery?.updateComponent("isBattery", {
					storage:
						(battery.components.isBattery?.capacity || 0) *
						Math.min(1, Math.max(0, input.storagePercent)),
				});
				pubsub.publish.systemsMonitor.batteries.get({
					shipId: battery?.components.isShipSystem?.shipId || -1,
				});
			}),
		setActivated: t.procedure
			.input(z.object({ batteryId: z.number(), activated: z.boolean() }))
			.send(({ ctx, input }) => {
				const battery = ctx.ecs.getEntityById(input.batteryId);
				if (!battery || !battery.components.isBattery) throw new Error("Battery not found.");
				battery.updateComponent("isBattery", { powerActivated: input.activated });
				pubsub.publish.systemsMonitor.batteries.get({
					shipId: battery?.components.isShipSystem?.shipId || -1,
				});
			}),
	}),

	systems: t.router({
		get: t.procedure
			.input(z.object({ shipId: z.number() }))
			.filter((publish: { shipId: number }, { input }) => {
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
				const systems: {
					id: number;
					name: string;
					type: ShipSystemTypes;
					power?: { powerLevels: number[]; batterySource: number | null; activated: boolean };
					heat?: {
						heat: number;
						maxHeat: number;
						maxSafeHeat: number;
						nominalHeat: number;
					};
					roomIds: number[];
				}[] = [];
				const ship = ctx.ecs.getEntityById(input.shipId);
				for (const systemId of ship?.components.shipSystems?.shipSystems.keys() || []) {
					const system = ctx.flight?.ecs.getEntityById(systemId);
					if (!system?.components.isShipSystem) continue;
					// Filter out reactors and batteries
					if (system.components.isReactor || system.components.isBattery) continue;

					const roomIds = getRoomBySystem(ship, system.components.isShipSystem.type).map(
						(room) => room.id,
					);
					systems.push({
						id: systemId,
						name: system.components.identity!.name,
						type: system.components.isShipSystem.type,
						power: system.components.power
							? {
									powerLevels: system.components.power.powerLevels,
									batterySource: system.components.power.batterySource,
									activated: system.components.power.powerActivated,
								}
							: undefined,

						heat: system.components.heat
							? {
									heat: system.components.heat.heat,
									maxHeat: system.components.heat.maxHeat,
									maxSafeHeat: system.components.heat.maxSafeHeat,
									nominalHeat: system.components.heat.nominalHeat,
								}
							: undefined,
						roomIds,
					});
				}

				return systems;
			}),
		setBatterySource: t.procedure
			.input(z.object({ systemId: z.number(), batterySource: z.number().nullable() }))
			.send(({ ctx, input }) => {
				const system = ctx.ecs.getEntityById(input.systemId);
				if (!system) throw new Error("System not found.");
				system.updateComponent("power", { batterySource: input.batterySource });
				pubsub.publish.systemsMonitor.systems.get({
					shipId: system.components.isShipSystem?.shipId || -1,
				});
			}),
		setActivated: t.procedure
			.input(z.object({ systemId: z.number(), activated: z.boolean() }))
			.send(({ ctx, input }) => {
				const system = ctx.ecs.getEntityById(input.systemId);
				if (!system) throw new Error("System not found.");
				system.updateComponent("power", { powerActivated: input.activated });
				pubsub.publish.systemsMonitor.systems.get({
					shipId: system.components.isShipSystem?.shipId || -1,
				});
			}),
	}),
	stream: t.procedure.input(z.object({ shipId: z.number() })).dataStream(({ input, ctx }) => {
		const set = new Set<Entity>();
		for (const entity of ctx.ecs.componentCache.get("power") || []) {
			if (entity.components.isShipSystem?.shipId === input.shipId) {
				set.add(entity);
			}
		}
		for (const entity of ctx.ecs.componentCache.get("isBattery") || []) {
			if (entity.components.isShipSystem?.shipId === input.shipId) {
				set.add(entity);
			}
		}
		for (const entity of ctx.ecs.componentCache.get("isReactor") || []) {
			if (entity.components.isShipSystem?.shipId === input.shipId) {
				set.add(entity);
			}
		}
		return set;
	}),
});

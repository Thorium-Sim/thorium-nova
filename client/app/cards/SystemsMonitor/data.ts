import { pubsub } from "@server/init/pubsub";
import { t } from "@server/init/t";
import type { Entity } from "@server/utils/ecs";
import { getShipSystems } from "@server/utils/getShipSystem";
import { getReactorInventory } from "@server/utils/getSystemInventory";
import type { MegaWattHour } from "@server/utils/unitTypes";
import { z } from "zod";

export const systemsMonitor = t.router({
	reactors: t.router({
		get: t.procedure
			.filter((publish: { shipId: number; systemId: number }, { ctx }) => {
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
						desiredOutput: r.components.isReactor!.outputAssignment.length,
						maxOutput: r.components.isReactor!.maxOutput,
						optimalOutputPercent: r.components.isReactor!.optimalOutputPercent,
						nominalHeat: r.components.heat!.nominalHeat,
						maxSafeHeat: r.components.heat!.maxSafeHeat,
						maxHeat: r.components.heat!.maxHeat,
						reserve,
						fuel: r.components.isReactor!.unusedFuel.amount || 0,
					};
				});
			}),
	}),
	batteries: t.router({
		get: t.procedure
			.filter((publish: { shipId: number; systemId: number }, { ctx }) => {
				if (publish && publish.shipId !== ctx.ship?.id) return false;
				return true;
			})
			.request(({ ctx }) => {
				const batteries = getShipSystems(ctx, { systemType: "battery" });
				return batteries.map((b) => ({
					id: b.id,
					name: b.components.identity!.name,
					capacity: b.components.isBattery!.capacity,
					storage: b.components.isBattery!.storage,
					chargeAmount: b.components.isBattery!.chargeAmount,
					chargeRate: b.components.isBattery!.chargeRate,
					outputAmount: b.components.isBattery!.outputAmount,
					outputRate: b.components.isBattery!.outputRate,
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
					if (!system) continue;
					systems.push({
						id: systemId,
						name: system.components.identity!.name,
						requestedPower: system.components.power?.requestedPower || 0,
						maxSafePower: system.components.power?.maxSafePower || 0,
						requiredPower: system.components.power?.requiredPower || 0,
						efficiency: system.components.efficiency!.efficiency || 1,
						heat: system.components.heat?.heat || 0,
						maxHeat: system.components.heat?.maxHeat || 0,
						maxSafeHeat: system.components.heat?.maxSafeHeat || 0,
						nominalHeat: system.components.heat?.nominalHeat || 0,
					});
				}

				return systems;
			}),
	}),
	stream: t.procedure.dataStream(({ ctx, entity }) => {
		if (!entity) return false;
		return Boolean(
			ctx.ship?.components.shipSystems?.shipSystems.has(entity.id),
		);
	}),
});

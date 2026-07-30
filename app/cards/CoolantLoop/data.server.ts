import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import type { Entity } from "@thorium/utils/ecs";
import z from "zod";

export const coolantLoop = t.router({
	get: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isCoolantTank"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input: { shipId } }) => {
			let coolantPump: Entity | null = null;
			let coolantRadiator: Entity | null = null;
			let coolantTank: Entity | null = null;
			try {
				coolantPump = getShipSystem(ctx.ecs, { systemType: "coolantPump", shipId });
				coolantRadiator = getShipSystem(ctx.ecs, {
					systemType: "coolantRadiator",
					shipId,
				});
				coolantTank = getShipSystem(ctx.ecs, {
					systemType: "coolantTank",
					shipId,
				});
			} catch {}

			return {
				coolantPump: {
					id: coolantPump?.id || -1,
					name: coolantPump?.components.identity!.name || "Pump",
					baseFlowRate: coolantPump?.components.isCoolantPump!.baseFlowRate || 40_000,
					requiredPower: coolantPump?.components.power?.powerLevels[0] || 1,
					maxSafePower: coolantPump?.components.power?.powerLevels.at(-1) || 1,
					powerDraw: coolantPump?.components.power?.powerDraw || 1,
					maxSafeHeat: coolantRadiator?.components.heat!.maxSafeHeat || 1000,
					maxHeat: coolantRadiator?.components.heat!.maxHeat || 2500,
					nominalHeat: coolantRadiator?.components.heat!.nominalHeat || 250,
				},
				coolantRadiator: {
					id: coolantRadiator?.id || -1,
					name: coolantRadiator?.components.identity!.name || "Radiator",
					inCoolantLoop: coolantRadiator?.components.heat!.inCoolantLoop ?? true,
					maxSafeHeat: coolantRadiator?.components.heat!.maxSafeHeat || 1000,
					maxHeat: coolantRadiator?.components.heat!.maxHeat || 2500,
					nominalHeat: coolantRadiator?.components.heat!.nominalHeat || 250,
				},
				coolantTank: {
					id: coolantTank?.id || -1,
					name: coolantTank?.components.identity!.name || "Coolant tank",
					capacity: coolantTank?.components.isCoolantTank?.capacity || 1,
					maxSafeHeat: coolantTank?.components.heat!.maxSafeHeat || 1000,
					maxHeat: coolantTank?.components.heat!.maxHeat || 2500,
					nominalHeat: coolantTank?.components.heat!.nominalHeat || 250,
				},
			};
		}),
	systems: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["heat"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			const systems: {
				id: number;
				name: string;
				nominalHeat: number;
				maxHeat: number;
				inCoolantLoop: boolean;
			}[] = [];
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() || []) {
				const system = ctx.ecs.getEntityById(systemId);
				if (
					system?.components.isCoolantPump ||
					system?.components.isCoolantRadiator ||
					system?.components.isCoolantTank
				)
					continue;
				if (system?.components.heat) {
					systems.push({
						id: system.id,
						name: system.components.identity?.name || system.components.isShipSystem?.type || "",
						nominalHeat: system.components.heat?.nominalHeat || 295,
						maxHeat: system.components.heat?.maxHeat || 1000,
						inCoolantLoop: system.components.heat.inCoolantLoop || false,
					});
				}
			}
			return systems;
		}),
	setPumpPower: t.procedure
		.input(z.object({ pumpId: z.number(), power: z.number() }))
		.send(({ ctx, input }) => {
			const pump = ctx.ecs.getEntityById(input.pumpId);
			pump?.updateComponent("power", { powerDraw: input.power });
			pubsub.publish.coolantLoop.get({ shipId: pump?.components.isShipSystem?.shipId || -1 });
		}),
	setSystemCooling: t.procedure
		.input(z.object({ systemId: z.number(), cooling: z.boolean() }))
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.systemId);
			if (!system?.components.heat) throw new Error("System not found.");
			system.updateComponent("heat", { inCoolantLoop: input.cooling });
			pubsub.publish.coolantLoop.systems({ shipId: system.components.isShipSystem?.shipId || -1 });
			if (system.components.isShipSystem?.type === "coolantRadiator") {
				pubsub.publish.coolantLoop.get({ shipId: system.components.isShipSystem?.shipId || -1 });
			}
		}),
	stream: t.procedure.input(z.object({ shipId: z.number() })).dataStream(({ ctx, input }) => {
		const set = new Set<Entity>();
		const ship = ctx.ecs.getEntityById(input.shipId);
		// Get all of the ships systems with heat components
		for (const [systemId] of ship?.components.shipSystems?.shipSystems || []) {
			const system = ctx.ecs.getEntityById(systemId);
			if (system?.components.heat) set.add(system);
		}
		return set;
	}),
});

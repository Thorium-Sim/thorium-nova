import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import z from "zod";

const legacyCoolantSystemTypes = ["impulseEngines", "warpEngines", "phasers", "reactor"];
export const coolantControl = t.router({
	tank: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isCoolantTank"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship) throw new Error("Ship not found");
			for (const systemId of ship.components.shipSystems?.shipSystems.keys() || []) {
				const system = ctx.ecs.getEntityById(systemId || -1);

				if (system?.components.isCoolantTank) {
					return {
						id: system.id,
						name: system.components.identity?.name || "Coolant Tank",
						transferSystem: system.components.isCoolantTank.transferSystem,
						transferDirection: system.components.isCoolantTank.transferDirection,
					};
				}
			}
			throw new Error("Coolant tank not found");
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
				heatRate: number;
				nominalHeat: number;
				maxHeat: number;
			}[] = [];
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() || []) {
				const system = ctx.ecs.getEntityById(systemId);
				if (
					system?.components.heat &&
					legacyCoolantSystemTypes.includes(system.components.isShipSystem?.type || "")
				) {
					systems.push({
						id: system.id,
						name: system.components.identity?.name || system.components.isShipSystem?.type || "",
						heatRate: system.components.heat.legacyHeatRate || 1,
						nominalHeat: system.components.heat?.nominalHeat || 295,
						maxHeat: system.components.heat?.maxHeat || 1000,
					});
				}
			}
			return systems;
		}),
	setTransfer: t.procedure
		.input(
			z.object({
				coolantTankId: z.number(),
				systemId: z.number().nullable(),
				transferDirection: z.enum(["in", "out"]),
			}),
		)
		.send(({ ctx, input }) => {
			const coolantTank = ctx.ecs.getEntityById(input.coolantTankId);

			if (!coolantTank) return;

			coolantTank.updateComponent("isCoolantTank", {
				transferDirection: input.transferDirection,
				transferSystem: input.systemId,
			});

			pubsub.publish.legacy.coolantControl.tank({
				shipId: coolantTank.components.isShipSystem?.shipId || -1,
			});
		}),

	setHeat: t.procedure
		.input(
			z.object({
				systemId: z.number(),
				heat: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.systemId);
			const heat = system?.components.heat;
			if (!system || !heat) return;
			const { nominalHeat, maxHeat } = heat;
			system.updateComponent("heat", {
				heat: Math.min(
					maxHeat,
					Math.max(nominalHeat, input.heat * (maxHeat - nominalHeat) + nominalHeat),
				),
			});
		}),
	setHeatRate: t.procedure
		.input(
			z.object({
				systemId: z.number(),
				heatRate: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.systemId);
			if (!system) return;
			system.updateComponent("heat", {
				legacyHeatRate: input.heatRate,
			});
			pubsub.publish.legacy.coolantControl.systems({
				shipId: system.components.isShipSystem?.shipId || -1,
			});
		}),
	setCoolant: t.procedure
		.input(
			z.object({
				systemId: z.number(),
				coolant: z.number(),
			}),
		)
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.systemId);
			if (!system) return;
			system.updateComponent("legacyCoolant", {
				coolant: input.coolant / 100,
			});
			pubsub.publish.legacy.coolantControl.systems({
				shipId: system.components.isShipSystem?.shipId || -1,
			});
		}),
	coolSystem: t.procedure
		.input(
			z.object({
				systemId: z.number(),
				cooling: z.boolean(),
			}),
		)
		.send(({ ctx, input }) => {
			const system = ctx.ecs.getEntityById(input.systemId);
			if (!system) return;
			system.updateComponent("legacyCoolant", {
				cooling: input.cooling,
			});
		}),
	stream: t.procedure.input(z.object({ shipId: z.number() })).dataStream(({ input, entity }) => {
		if (!entity) return false;

		return Boolean(
			entity.components.isShipSystem?.shipId === input.shipId &&
			(entity.components.isCoolantTank ||
				(entity.components.legacyCoolant &&
					legacyCoolantSystemTypes.includes(entity.components.isShipSystem.type))),
		);
	}),
});

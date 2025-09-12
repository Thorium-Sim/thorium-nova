import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import { z } from "zod";

const legacyCoolantSystemTypes = [
	"impulseEngines",
	"warpEngines",
	"phasers",
	"reactor",
];
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
			for (const systemId of ship.components.shipSystems?.shipSystems.keys() ||
				[]) {
				const system = ctx.ecs.getEntityById(systemId || -1);

				if (system?.components.isCoolantTank) {
					return {
						id: system.id,
						transferSystem: system.components.isCoolantTank.transferSystem,
						transferDirection:
							system.components.isCoolantTank.transferDirection,
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
			}[] = [];
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
				[]) {
				const system = ctx.ecs.getEntityById(systemId);
				if (
					system?.components.heat &&
					legacyCoolantSystemTypes.includes(
						system.components.isShipSystem?.type || "",
					)
				) {
					systems.push({
						id: system.id,
						name:
							system.components.identity?.name ||
							system.components.isShipSystem?.type ||
							"",
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

	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ ctx, input, entity }) => {
			if (!entity) return false;

			return Boolean(
				entity.components.isShipSystem?.shipId === input.shipId &&
					(entity.components.isCoolantTank ||
						(entity.components.legacyCoolant &&
							legacyCoolantSystemTypes.includes(
								entity.components.isShipSystem.type,
							))),
			);
		}),
});

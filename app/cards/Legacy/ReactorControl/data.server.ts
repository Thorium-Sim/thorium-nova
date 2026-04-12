import { t } from "@thorium/.server/init/t";
import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { shipPubsubFilter } from "@thorium/utils/.server/shipPubsubFilter";
import z from "zod";

export const reactorControl = t.router({
	reactors: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter(shipPubsubFilter)
		.autoPublish(
			["isReactor"],
			(entity) =>
				entity.components.isShipSystem && {
					shipId: entity.components.isShipSystem.shipId,
				},
		)
		.request(({ ctx, input }) => {
			const reactors = getShipSystems(ctx.ecs, {
				systemType: "reactor",
				shipId: input.shipId,
			});

			return reactors.map((reactor) => ({
				id: reactor.id,
				name: reactor.components.identity?.name || "",
				maxOutput: reactor.components.isReactor?.maxOutput || 0,
				settings: reactor.components.isReactor?.legacySettings || [],
				efficiency: reactor.components.damage?.efficiency || 0,
				offline: reactor.components.damage?.offline,
				externalPower: reactor.components.isReactor?.externalPower,
				nominalHeat: reactor.components.heat?.nominalHeat || 0,
				maxHeat: reactor.components.heat?.maxHeat || 0,
			}));
		}),
});

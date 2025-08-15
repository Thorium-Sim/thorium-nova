import z from "zod";
import { t } from "@thorium/.server/init/t";
import { getAggregateDamage } from "@thorium/utils/flags/damageTypes";

export const damageReports = t.router({
	systems: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const systems: {
				id: number;
				name: string;
				damage: number;
				onlineDamage: number;
				offlineDamage: number;
				offline: boolean;
			}[] = [];
			const ship = ctx.ecs.getEntityById(input.shipId);
			for (const systemId of ship?.components.shipSystems?.shipSystems.keys() ||
				[]) {
				const system = ctx.ecs.getEntityById(systemId);
				if (!system?.components.isShipSystem || !system.components.damage)
					continue;
				systems.push({
					id: systemId,
					name: system.components.identity!.name,
					damage: getAggregateDamage(system),
					onlineDamage: system.components.damage!.onlineDamage,
					offlineDamage: system.components.damage!.offlineDamage,
					offline: system.components.damage!.offline,
				});
			}
			return systems;
		}),
	damageReports: t.procedure
		.input(z.object({ shipId: z.number() }))
		.filter((publish: { shipId: number }, { ctx, input }) => {
			if (publish && publish.shipId !== input.shipId) return false;
			return true;
		})
		.autoPublish(
			["damageReport"],
			(entity) =>
				entity.components.damageReport && {
					shipId: entity.components.damageReport.shipId,
				},
		)
		.request(({ ctx, input }) => {}),
});

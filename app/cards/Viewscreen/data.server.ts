import { t } from "@thorium/.server/init/t";
import type { Entity } from "@thorium/utils/ecs";
import z from "zod";

export const viewscreen = t.router({
	system: t.procedure
		.input(z.object({ clientId: z.string() }))
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			const systemId = ctx.getPlayerShip(input.clientId)?.components.position?.parentId;
			if (typeof systemId !== "number") return null;
			const system = ctx.flight?.ecs.getEntityById(systemId);
			if (!system) return null;

			return {
				id: system.id,
				name: system.components.identity?.name,
				skyboxKey: system.components.isSolarSystem?.skyboxKey,
			};
		}),
	stream: t.procedure.input(z.object({ shipId: z.number() })).dataStream(({ ctx, input }) => {
		const set = new Set<Entity>();
		const ship = ctx.ecs.getEntityById(input.shipId);
		const systemId = ship?.components.position?.parentId;
		if (typeof systemId === "undefined") {
			return set;
		}
		for (const entity of ctx.ecs.componentCache.get("isImpulseEngines") || []) {
			if (entity.components.isShipSystem?.shipId === input.shipId) {
				set.add(entity);
			}
		}
		for (const entity of ctx.ecs.componentCache.get("isWarpEngines") || []) {
			if (entity.components.isShipSystem?.shipId === input.shipId) {
				set.add(entity);
			}
		}

		for (const entity of ctx.ecs.componentCache.get("position") || []) {
			if (entity.components.position?.parentId === systemId) {
				set.add(entity);
			}
		}
		return set;
	}),
});

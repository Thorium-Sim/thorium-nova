import { t } from "@thorium/.server/init/t";
import { z } from "zod";

export const viewscreen = t.router({
	system: t.procedure
		.input(z.object({ clientId: z.string() }))
		.request(({ ctx, input }) => {
			const systemId = ctx.getPlayerShip(input.clientId)?.components.position
				?.parentId;
			if (typeof systemId !== "number") return null;
			const system = ctx.flight?.ecs.getEntityById(systemId);

			if (!system) return null;

			return {
				id: system.id,
				name: system.components.identity?.name,
				skyboxKey: system.components.isSolarSystem?.skyboxKey,
			};
		}),
	stream: t.procedure
		.input(z.object({ shipId: z.number() }))
		.dataStream(({ ctx, input, entity }) => {
			if (!entity) return false;
			const ship = ctx.flight?.ecs.getEntityById(input.shipId);
			if (!ship) return false;
			const systemId = ship.components.position?.parentId || null;

			return Boolean(
				(entity.components.position &&
					entity.components.position.parentId === systemId) ||
					((entity.components.isWarpEngines ||
						entity.components.isImpulseEngines) &&
						ship?.components.shipSystems?.shipSystems.has(entity.id)),
			);
		}),
});

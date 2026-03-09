import { t } from "@thorium/.server/init/t";
import { z } from "zod";

export const viewscreen = t.router({
	camera: t.procedure
		.input(z.object({ shipId: z.number() }))
		.autoPublish([], () => null)
		.request(({ ctx, input }) => {
			if (!ctx.flight?.ecs) return null;
			for (const [, entity] of ctx.flight.ecs.entities) {
				if (
					entity.components.isShipSystem?.type === "mainCamera" &&
					entity.components.isShipSystem?.shipId === input.shipId &&
					entity.components.isMainCamera
				) {
					return { fov: entity.components.isMainCamera.fov };
				}
			}
			return null;
		}),
	system: t.procedure
		.input(z.object({ clientId: z.string() }))
		.autoPublish([], () => null)
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

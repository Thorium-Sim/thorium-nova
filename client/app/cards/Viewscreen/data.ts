import {t} from "@server/init/t";
import {z} from "zod";

export const viewscreen = t.router({
  system: t.procedure.request(({ctx}) => {
    const systemId = ctx.ship?.components.position?.parentId;
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
    .input(z.object({shipId: z.number()}).optional())
    .dataStream(({ctx, input, entity}) => {
      if (!entity) return false;
      const ship = input?.shipId
        ? ctx.flight?.ecs.getEntityById(input.shipId)
        : ctx.ship;
      if (!ship) return false;
      const systemId = ship.components.position?.parentId || null;

      return Boolean(
        (entity.components.position &&
          entity.components.position.parentId === systemId) ||
          ((entity.components.isWarpEngines ||
            entity.components.isImpulseEngines) &&
            ship?.components.shipSystems?.shipSystems.has(entity.id))
      );
    }),
});

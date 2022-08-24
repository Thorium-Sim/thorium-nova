import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export const requests = {
  viewscreenSystem(context: DataContext) {
    const shipSystem = context.ship?.components.position?.parentId;
    if (!shipSystem) return null;

    const system = context.flight?.ecs.getEntityById(shipSystem);

    if (!system) return null;

    return {
      id: system.id,
      name: system.components.identity?.name,
      skyboxKey: system.components.isSolarSystem?.skyboxKey,
    };
  },
};

export function dataStream(
  entity: Entity,
  context: DataContext,
  params?: {shipId: number}
): boolean {
  const ship = params?.shipId
    ? context.flight?.ecs.getEntityById(params.shipId)
    : context.ship;
  if (!ship) return false;
  const systemId = ship.components.position?.parentId || null;

  return Boolean(
    (entity.components.position &&
      entity.components.position.parentId === systemId) ||
      ((entity.components.isWarpEngines ||
        entity.components.isImpulseEngines) &&
        ship?.components.shipSystems?.shipSystemIds.includes(entity.id))
  );
}

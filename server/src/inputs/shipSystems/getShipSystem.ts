import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export function getShipSystem(
  context: DataContext,
  param: {systemType: string} | {systemId: number}
) {
  let system: Entity | undefined | null;
  if ("systemId" in param) {
    system = context.flight?.ecs.getEntityById(param.systemId);
  } else {
    const ship = context.ship;
    system = ship?.components.shipSystems?.shipSystemIds.reduce(
      (sys: undefined | Entity, id) => {
        if (sys) return sys;
        const entity = context.flight?.ecs.getEntityById(id);
        if (entity?.components.isShipSystem?.type === param.systemType) {
          return entity;
        }
      },
      undefined
    );
  }
  if (!system) throw new Error(`System ${JSON.stringify(param)} not found.`);
  return system;
}

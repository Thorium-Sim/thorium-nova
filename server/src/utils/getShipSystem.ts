import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {pascalCase} from "change-case";
export function getShipSystem(
  context: DataContext,
  param: {systemType: string} | {systemId: number}
) {
  let system: Entity | undefined | null;
  if ("systemId" in param && param.systemId) {
    system = context.flight?.ecs.getEntityById(param.systemId);
  } else if ("systemType" in param) {
    const ship = context.ship;
    system = ship?.components.shipSystems?.shipSystemIds.reduce(
      (sys: undefined | Entity, id) => {
        if (sys) return sys;
        const entity = context.flight?.ecs.getEntityById(id);

        if (
          entity?.components &&
          `is${pascalCase(param.systemType)}` in entity.components
        ) {
          return entity;
        }
        return sys;
      },
      undefined
    );
  }
  if (!system) throw new Error(`System ${JSON.stringify(param)} not found.`);
  return system;
}

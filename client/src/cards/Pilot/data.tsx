import {getShipSystem} from "client/src/utils/getShipSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export const requests = {
  impulseEngines(context: DataContext) {
    return getShipSystem(context, "impulseEngines");
  },
};

export function dataStream(
  entity: Entity,
  context: DataContext,
  params: {systemId: number | null}
): boolean {
  return Boolean(
    entity.components.position &&
      entity.components.position.parentId === params.systemId
  );
}

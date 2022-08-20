import {getShipSystem} from "client/src/utils/getShipSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export const requests = {
  playerShipId(context: DataContext) {
    if (!context.ship) throw new Error("Cannot find ship");
    return context.ship.id;
  },
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

export const inputs = {
  impulseEnginesSetSpeed() {},
};

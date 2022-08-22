import {getShipSystem} from "client/src/utils/getShipSystem";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export const requests = {
  pilotPlayerShip(context: DataContext) {
    if (!context.ship) throw new Error("Cannot find ship");
    return {
      id: context.ship.id,
      currentSystem: context.ship.components.position?.parentId || null,
    };
  },
  impulseEngines(context: DataContext) {
    return getShipSystem(context, "impulseEngines");
  },
};

export function dataStream(
  entity: Entity,
  context: DataContext,
  params?: {systemId: number | null}
): boolean {
  const systemId =
    params?.systemId || context.ship?.components.position?.parentId;
  if (typeof systemId === "undefined") {
    return false;
  }
  return Boolean(
    entity.components.position &&
      entity.components.position.parentId === systemId
  );
}

export const inputs = {
  impulseEnginesSetSpeed() {},
};

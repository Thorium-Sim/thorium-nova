import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export const requests = {
  navigationShip: (
    context: DataContext,
    params: {},
    publishParams: {shipId: number} | {clientId: string}
  ) => {
    if (!context.ship) throw null;
    return {
      id: context.ship.id,
      name: context.ship.components.identity?.name,
      position: context.ship.components.position,
      icon: context.ship.components.isShip?.assets.logo,
    };
  },
};

export function dataStream(entity: Entity, context: DataContext): boolean {
  return Boolean(entity.components.position && entity.id === context.ship?.id);
}

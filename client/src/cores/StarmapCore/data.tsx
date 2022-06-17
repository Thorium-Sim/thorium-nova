import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";

export const requests = {
  starmapSystems: (context: DataContext) => {
    if (!context.flight) return [];
    const data = context.flight.ecs.entities.reduce(
      (prev: Pick<Entity, "components" | "id">[], {components, id}) => {
        if (components.isSolarSystem) prev.push({components, id});
        return prev;
      },
      []
    );
    return data;
  },
  starmapShips: (context: DataContext) => {
    // TODO: May 24 2022 - This really should be a netrequest so it can be
    // filtered based on what system the flight director is currently looking at.
    if (!context.flight) return [];
    const data = context.flight.ecs.entities.reduce(
      (prev: Pick<Entity, "components" | "id">[], {components, id}) => {
        if (components.isShip && components.position?.type === "interstellar")
          prev.push({components, id});
        return prev;
      },
      []
    );
    return data;
  },
};

export const dataStream = (entity: Entity, context: DataContext) => {
  return entity.components.isShip && entity.components.position;
};

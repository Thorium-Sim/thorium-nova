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
  starmapSystem: (context: DataContext, params: {systemId: number}) => {
    if (!context.flight) throw new Error("No flight in progress");
    const data = context.flight.ecs.getEntityById(params.systemId);
    if (!data?.components.isSolarSystem) throw new Error("Not a solar system");
    return {id: data.id, components: data.components};
  },
  starmapSystemEntities: (context: DataContext, params: {systemId: number}) => {
    if (!context.flight) return [];
    const data = context.flight.ecs.entities.reduce(
      (prev: Pick<Entity, "components" | "id">[], {components, id}) => {
        if (
          components.position?.parentId === params.systemId ||
          components.satellite?.parentId === params.systemId
        )
          prev.push({components, id});
        return prev;
      },
      []
    );
    return data;
  },
  starmapShips: (context: DataContext, params: {systemId?: number | null}) => {
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

export const dataStream = (
  entity: Entity,
  context: DataContext,
  params: {systemId?: number | null}
) => {
  if (entity.components.isShip && entity.components.position) {
    if (entity.components.position.type === "interstellar" && !params.systemId)
      return true;
    if (entity.components.position.parentId === params.systemId) return true;
  }
  return false;
};

import {matchSorter} from "match-sorter";
import ShipPlugin from "server/src/classes/Plugins/Ship";
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
  starmapSystemEntities: (
    context: DataContext,
    params: {systemId?: number}
  ) => {
    if (!context.flight) return [];
    if (!params.systemId) return [];
    const data = context.flight.ecs.entities.reduce(
      (prev: Pick<Entity, "components" | "id">[], {components, id}) => {
        if (components.isShip) return prev;
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
  starmapShips: (
    context: DataContext,
    params: {systemId?: number | null},
    publishParams: {systemId: number | null}
  ) => {
    if (
      publishParams &&
      publishParams.systemId !== params.systemId &&
      params.systemId !== undefined
    )
      throw null;
    if (!context.flight) return [];
    const data = context.flight.ecs.entities.reduce(
      (
        prev: {id: number; modelUrl?: string; logoUrl?: string; size: number}[],
        {components, id}
      ) => {
        if (components.isShip) {
          if (
            (params.systemId &&
              components.position?.parentId === params.systemId) ||
            (!params.systemId && components.position?.type === "interstellar")
          ) {
            prev.push({
              id,
              modelUrl: components.isShip.assets.model,
              logoUrl: components.isShip.assets.logo,
              size: components.size?.length || 50,
            });
          }
        }
        return prev;
      },
      []
    );
    return data;
  },
  shipSpawnSearch: (context: DataContext, params: {query: string}) => {
    if (!context.flight) return [];
    const shipTemplates = context.server.plugins
      .filter(p => context.flight?.pluginIds.includes(p.id))
      .reduce((acc: ShipPlugin[], plugin) => {
        return acc.concat(plugin.aspects.ships);
      }, []);

    // TODO August 20, 2022: Add faction here too
    return matchSorter(shipTemplates, params.query, {
      keys: ["name", "description", "category", "tags"],
    })
      .slice(0, 10)
      .map(({pluginName, name, category, assets: {vanity}}) => ({
        id: name,
        pluginName,
        name,
        category,
        vanity,
      }));
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

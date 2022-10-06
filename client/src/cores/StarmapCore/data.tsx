import {matchSorter} from "match-sorter";
import ShipPlugin from "server/src/classes/Plugins/Ship";
import {PositionComponent} from "server/src/components/position";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {pubsub} from "server/src/utils/pubsub";
import {Coordinates} from "server/src/utils/unitTypes";

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
  /** Includes all the things in a system that isn't a ship */
  starmapSystemEntities: (
    context: DataContext,
    params: {systemId?: number}
  ) => {
    if (!context.flight) return [];
    if (params.systemId === null || params.systemId === undefined) return [];
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
  /** Includes all the ship in a system or interstellar space */
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
            (typeof params.systemId === "number" &&
              components.position?.parentId === params.systemId) ||
            ((params.systemId === null || params.systemId === undefined) &&
              components.position?.type === "interstellar")
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
  /** Useful for fetching a single ship when following that ship */
  starmapShip: (
    context: DataContext,
    params: {shipId?: number | null},
    publishParams: {shipId: number}
  ) => {
    if (!params.shipId) return null;
    if (publishParams && publishParams.shipId !== params.shipId) throw null;

    if (!context.flight) return null;

    const entity = context.flight.ecs.getEntityById(params.shipId);
    if (!entity) return null;
    return {id: entity.id, systemId: entity.components.position?.parentId};
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
  systemAutopilot(
    context: DataContext,
    params: {systemId: null | number},
    publishParams: {systemId: number | null}
  ) {
    if (publishParams && publishParams.systemId !== params.systemId) throw null;
    const autopilotSystem = context.flight?.ecs.systems.find(
      system => system.constructor.name === "AutoThrustSystem"
    );
    const ships = autopilotSystem?.entities.filter(
      entity => entity.components.position?.parentId === params.systemId
    );

    type AutopilotInfo = {
      forwardAutopilot: boolean;
      destinationName: string;
      destinationPosition: Coordinates<number> | null;
      destinationSystemPosition: Coordinates<number> | null;
      locked: boolean;
    };

    return (
      ships?.reduce((acc: {[id: number]: AutopilotInfo}, ship) => {
        const waypointId = ship.components.autopilot?.destinationWaypointId;
        let destinationName = "";
        let waypoint;
        if (typeof waypointId === "number") {
          waypoint = context.flight?.ecs.getEntityById(waypointId);
          destinationName =
            waypoint?.components.identity?.name
              .replace(" Waypoint", "")
              .trim() || "";
        }
        const waypointParentId = waypoint?.components.position?.parentId;

        const waypointSystemPosition =
          typeof waypointParentId === "number"
            ? context.flight?.ecs.getEntityById(waypointParentId)?.components
                .position || null
            : null;

        acc[ship.id] = {
          forwardAutopilot: !!ship.components.autopilot?.forwardAutopilot,
          destinationName,
          destinationPosition:
            ship.components.autopilot?.desiredCoordinates || null,
          destinationSystemPosition: waypointSystemPosition,
          locked: !!ship.components.autopilot?.desiredCoordinates,
        };
        return acc;
      }, {}) || {}
    );
  },
};

export const inputs = {
  shipsSetDestinations(
    context: DataContext,
    params: {
      ships: {
        id: number;
        position: Coordinates<number>;
        systemId: number | null;
      }[];
    }
  ) {
    const systemIds = new Set<number | null>();

    params.ships.forEach(ship => {
      const entity = context.flight?.ecs.getEntityById(ship.id);
      entity?.updateComponent("autopilot", {
        desiredCoordinates: ship.position,
        desiredSolarSystemId: ship.systemId,
      });
      if (typeof entity?.components.position?.parentId !== "undefined") {
        systemIds.add(entity.components.position.parentId);
      }
      pubsub.publish("autopilot", {shipId: ship.id});
    });

    systemIds.forEach(id => {
      pubsub.publish("systemAutopilot", {systemId: id});
    });
  },
};

export const dataStream = (
  entity: Entity,
  context: DataContext,
  params: {systemId?: number | null}
) => {
  if (entity.components.isShip && entity.components.position) {
    if (
      entity.components.position.type === "interstellar" &&
      (params.systemId === null || params.systemId === undefined)
    )
      return true;
    if (entity.components.position.parentId === params.systemId) {
      return true;
    }
  }
  return false;
};

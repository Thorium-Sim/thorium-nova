import {matchSorter} from "match-sorter";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {getOrbitPosition} from "server/src/utils/getOrbitPosition";
import {Vector3} from "three";

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
  navigationSearch: async (
    context: DataContext,
    params: {query: string},
    publishParams: {}
  ) => {
    if (publishParams !== null) throw null;
    const {query} = params;

    // Get all of the planet, star, and solar system entities that match the query.
    const matchItems = matchSorter(
      context.flight?.ecs.entities
        .filter(
          e =>
            e.components.isStar ||
            e.components.isPlanet ||
            e.components.isSolarSystem
        )
        .map(m => {
          let position = m.components.position;
          if (!position) {
            const {x, y, z} = getCompletePositionFromOrbit(m);
            const parentId = getObjectSystem(m)?.id || null;
            position = {
              x,
              y,
              z,
              type: m.components.isSolarSystem ? "interstellar" : "solar",
              parentId: m.components.isSolarSystem ? null : parentId,
            };
          }
          return {
            ...m,
            type: m.components.isSolarSystem
              ? "solar"
              : m.components.isPlanet
              ? "planet"
              : m.components.isShip
              ? "ship"
              : "star",
            name: m.components.identity!.name,
            description: m.components.identity?.description,
            temperature: m.components.temperature?.temperature,
            spectralType: m.components.isStar?.spectralType,
            classification: m.components.isPlanet?.classification,
            mass:
              m.components.isStar?.solarMass ||
              m.components.isPlanet?.terranMass,
            population: m.components.population?.count,
            position,
          } as const;
        }) || [],
      query,
      {
        keys: [
          "name",
          "description",
          "temperature",
          "spectralType",
          "classification",
          "mass",
          "population",
        ],
      }
    ).map(m => ({
      // TODO Aug 1 2022 - Add in a distance calculation.
      id: m.id,
      name: m.name,
      position: m.position,
      type: m.type,
    }));

    return matchItems;
  },
};

function getCompletePositionFromOrbit(object: Entity) {
  const origin = new Vector3(0, 0, 0);
  if (object.components.satellite) {
    if (object.components.satellite.parentId) {
      const parent = object.ecs?.entities.find(
        e => e.id === object.components.satellite?.parentId
      );
      if (parent?.components?.satellite) {
        const parentPosition = getOrbitPosition(parent.components.satellite);
        origin.copy(parentPosition);
      }
    }
    const position = getOrbitPosition({
      ...object.components.satellite,
      origin,
    });
    return position;
  }
  return new Vector3();
}

function getObjectSystem(obj: Entity): Entity | null {
  const objSystemId = obj.components.position?.parentId;
  if (objSystemId) {
    const parentObject = obj.ecs?.entities.find(e => e.id === objSystemId);
    if (parentObject) return parentObject;
  }

  if (obj.components.isSolarSystem) return obj;
  const parentObjId = obj.components?.satellite?.parentId;
  const parent = obj.ecs?.entities.find(e => e.id === parentObjId);
  if (!parent) return null;
  return getObjectSystem(parent);
}

export function dataStream(entity: Entity, context: DataContext): boolean {
  return Boolean(entity.components.position && entity.id === context.ship?.id);
}

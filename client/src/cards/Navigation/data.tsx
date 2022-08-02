import {PositionComponent} from "server/src/components/position";
import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {getOrbitPosition} from "server/src/utils/getOrbitPosition";
import {pubsub} from "server/src/utils/pubsub";
import {
  Coordinates,
  Kilometer,
  LightMinute,
  solarRadiusToKilometers,
} from "server/src/utils/unitTypes";
import {Vector3} from "three";
import {matchSorter} from "match-sorter";

type Waypoint = {
  id: number;
  name: string;
  objectId?: number;
  position: Omit<PositionComponent, "init">;
};

export const requests = {
  navigationShip: (
    context: DataContext,
    params: {},
    publishParams: {shipId: number} | {clientId: string}
  ) => {
    if (
      publishParams &&
      (("shipId" in publishParams &&
        publishParams.shipId !== context.ship?.id) ||
        ("clientId" in publishParams &&
          publishParams.clientId !== context.clientId))
    )
      throw null;
    if (!context.ship) throw null;
    return {
      id: context.ship.id,
      name: context.ship.components.identity?.name,
      position: context.ship.components.position,
      icon: context.ship.components.isShip?.assets.logo,
    };
  },
  navigationGetObject: (
    context: DataContext,
    params: {objectId?: number},
    publishParams: {shipId: number}
  ) => {
    if (!context.flight) throw new Error("No flight");
    if (publishParams && publishParams.shipId !== context.ship?.id) throw null;
    const shipSystem =
      context.flight.ecs.entities.find(
        entity => entity.id === context.ship?.components.position?.parentId
      ) || null;
    const object = context.flight.ecs.getEntityById(params?.objectId || -1);

    if (!object)
      return {
        object: null,
        objectSystem: null,
        shipSystem: shipSystem?.components.position
          ? {id: shipSystem?.id, ...shipSystem?.components.position}
          : null,
      };
    const objectSystem = getObjectSystem(object);
    return {
      object: {
        position: object.components.position,
        name: object.components.identity?.name,
        classification: getClassification(),
        type: object.components.isShip
          ? "ship"
          : object.components.isPlanet
          ? "planet"
          : object.components.isStar
          ? "star"
          : object.components.isSolarSystem
          ? "solarSystem"
          : "unknown",
        vanity: object.components.isShip?.assets.vanity,
        hue: object.components.isStar?.hue,
        isWhite: object.components.isStar?.isWhite,
        cloudMapAsset: object.components.isPlanet?.cloudMapAsset,
        ringMapAsset: object.components.isPlanet?.ringMapAsset,
        textureMapAsset: object.components.isPlanet?.textureMapAsset,
      },
      objectSystem: objectSystem?.components.position
        ? {id: objectSystem?.id, ...objectSystem.components.position}
        : null,
      shipSystem: shipSystem?.components.position
        ? {id: shipSystem?.id, ...shipSystem.components.position}
        : null,
    };

    function getClassification() {
      if (!object) return "";
      if (object.components.isPlanet)
        return `Class ${object.components.isPlanet.classification} Planet`;
      if (object.components.isStar)
        return `Class ${object.components.isStar.spectralType} Star`;
      if (object.components.isShip)
        return `${
          object.components.isShip.shipClass
            ? `${object.components.isShip.shipClass} Class `
            : ""
        }${object.components.isShip.category}`;
      if (object.components.isSolarSystem) return "Solar System";
      return "";
    }
  },
  waypoints: (
    context: DataContext,
    params: {shipId?: number; systemId: "all" | number | null},
    publishParams: {shipId: number}
  ) => {
    const shipId = params.shipId ?? context.ship?.id;
    if (publishParams !== null && shipId !== publishParams.shipId) throw null;
    const waypoints = context.flight?.ecs.entities.reduce(
      (prev: Waypoint[], next) => {
        if (
          next.components.isWaypoint?.assignedShipId === shipId &&
          (params.systemId === "all" ||
            next.components.position?.parentId === params.systemId)
        ) {
          if (next.components.position)
            prev.push({
              id: next.id,
              name: next.components.identity?.name || "",
              objectId: next.components.isWaypoint?.attachedObjectId,
              position: next.components.position,
            });
        }
        return prev;
      },
      []
    );
    return waypoints || [];
  },
  navigationSearch: async (
    context: DataContext,
    params: {query: string},
    publishParams: null
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

export function dataStream(entity: Entity, context: DataContext): boolean {
  return Boolean(entity.components.position && entity.id === context.ship?.id);
}

export const inputs = {
  waypointSpawn(
    context: DataContext,
    params:
      | {systemId: number; position: Coordinates<Kilometer>}
      | {systemId: null; position: Coordinates<LightMinute>}
      | {entityId: number}
  ) {
    if (!context.flight) throw new Error("No flight in progress");
    const ship = context.ship;
    if (!ship) throw new Error("No ship selected.");
    const shipId = ship.id;
    let position = {x: 0, y: 0, z: 0};
    let systemId: number | null = null;
    let object: Entity | undefined = undefined;
    if ("entityId" in params) {
      object = context.flight?.ecs.entities.find(e => e.id === params.entityId);
      if (!object) throw new Error("No object found.");
      position = getObjectOffsetPosition(object, ship);
      const sys = getObjectSystem(object);
      systemId = sys?.id ?? null;
      if (sys?.id === object.id) systemId = null;
      const maybeWaypoint = context.flight.ecs.entities.find(
        e =>
          e.components.isWaypoint?.assignedShipId === shipId &&
          e.components.isWaypoint?.attachedObjectId === object?.id
      );
      if (maybeWaypoint) {
        maybeWaypoint.updateComponent("position", {
          ...position,
          type: systemId ? "solar" : "interstellar",
          parentId: systemId,
        });
        pubsub.publish("waypoints", {
          shipId,
        });
        // TODO July 30, 2022: It might be necessary to publish to make this appear on the Pilot or Viewscreen.
        return maybeWaypoint;
      }
    } else if ("position" in params) {
      position = params.position;
      systemId = params.systemId;
    } else {
      throw new Error("Either position or objectId are required");
    }

    const newWaypoint = new Entity();
    newWaypoint.addComponent("isWaypoint", {
      assignedShipId: shipId,
      attachedObjectId: object?.id,
    });
    // If we have an object, set the name to the name of that object
    if (object?.components.identity?.name) {
      // TODO: INTL in the server here.
      newWaypoint.addComponent("identity", {
        name: `${object.components.identity.name} Waypoint`,
      });
    } else {
      // Count up the highest waypoint count and use that.
      const waypointNum =
        1 +
        (context.flight.ecs.entities || []).reduce((prev, next) => {
          if (next.components.isWaypoint?.assignedShipId === shipId) {
            const nameWords = next.components.identity?.name.split(" ") || [];
            const num = parseInt(nameWords[nameWords.length - 1], 10);
            if (!num || num < prev) return prev;
            return num;
          }
          return prev;
        }, 0);
      newWaypoint.addComponent("identity", {
        name: `Waypoint ${waypointNum}`,
      });
    }
    newWaypoint.addComponent("position", {
      ...position,
      parentId: systemId,
      type: systemId ? "solar" : "interstellar",
    });

    context.flight.ecs.addEntity(newWaypoint);

    pubsub.publish("waypoints", {
      shipId,
    });

    return newWaypoint;
  },
  waypointDelete(context: DataContext, params: {waypointId: number}) {
    if (!context.flight) throw new Error("No flight in progress");
    const ship = context.ship;
    if (!ship) throw new Error("No ship selected.");
    const shipId = ship.id;
    const waypoint = context.flight.ecs.entities.find(
      e => e.id === params.waypointId
    );
    if (!waypoint) throw new Error("No waypoint found.");
    if (waypoint.components.isWaypoint?.assignedShipId !== shipId)
      throw new Error("Waypoint is not assigned to this ship.");
    context.flight.ecs.removeEntity(waypoint);
    pubsub.publish("waypoints", {
      shipId,
    });
  },
};

function getObjectOffsetPosition(object: Entity, ship: Entity) {
  const objectCenter = new Vector3();
  if (object.components.satellite) {
    objectCenter.copy(getCompletePositionFromOrbit(object));
  } else if (object.components.position) {
    objectCenter.set(
      object.components.position.x,
      object.components.position.y,
      object.components.position.z
    );
  } else {
    throw new Error("Unable to determine object's position.");
  }
  let objectAngle = new Vector3(0, 0, 1);
  const shipPosition = new Vector3(
    ship.components.position?.x,
    ship.components.position?.y,
    ship.components.position?.z
  );
  // Determine the angle between the ship's location and the waypoint
  const objectSystem = getObjectSystem(object);
  if (
    objectSystem?.id === ship.components.position?.parentId ||
    (!objectSystem?.id && !ship.components.position?.parentId)
  ) {
    // The waypoint is in the same system as the ship or both the waypoint and ship are in interstellar space.
    objectAngle.subVectors(shipPosition, objectCenter).normalize();
  } else if (objectSystem && !ship.components.position?.parentId) {
    // The ship is in interstellar space, but the waypoint is in a system.
    // Get the angle between the ship's position  and  the system's position.
    const system = object.ecs?.entities.find(
      e => e.id === object.components.position?.parentId
    );
    if (!system) {
      // This is an unlikely case, so we'll just do nothing. It won't be the end of the world.
    } else {
      objectAngle
        .subVectors(
          shipPosition,
          new Vector3(
            system.components.position?.x,
            system.components.position?.y,
            system.components.position?.z
          )
        )
        .normalize();
    }
  } else if (!objectSystem && ship.components.position?.parentId) {
    // The object is in interstellar space while the ship is in a system; use the angle from the ship's system
    // to the object.
    const system = object.ecs?.entities.find(
      e => e.id === ship.components.position?.parentId
    );
    if (!system) {
      // This is an unlikely case, so we'll just do nothing. It won't be the end of the world.
    } else {
      objectAngle
        .subVectors(
          new Vector3(
            system.components.position?.x,
            system.components.position?.y,
            system.components.position?.z
          ),
          objectCenter
        )
        .normalize();
    }
  }

  if (!objectSystem && object.components.isSolarSystem) {
    // If the object is a planetary system, just use the actual position of the system.
    // You can't crash into a system ;)
    return objectCenter;
  } else {
    // Take the vector that we've calculated and set the waypoint position along that line
    // with a bit of distance. The distance is proportional to the radius of the object itself
    // and the size of the ship: distanceFromCenter = crewShipSize * 2 + objectSize * 0.5
    const objectSize =
      object.components.size?.length ||
      object.components.isPlanet?.radius ||
      solarRadiusToKilometers(object.components.isStar?.radius || 1) ||
      1;
    const distanceFromCenter =
      ((ship.components.size?.length || 1) / 1000) * 2 + objectSize * 1.25;

    return objectAngle.multiplyScalar(distanceFromCenter).add(objectCenter);
  }
}

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

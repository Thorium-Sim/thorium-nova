import Entity from "server/helpers/ecs/entity";
import {GraphQLContext} from "server/helpers/graphqlContext";
import {
  Arg,
  Ctx,
  ID,
  Mutation,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";
import uuid from "uniqid";
import {pubsub} from "server/helpers/pubsub";
import App from "server/app";
import {Coordinates} from "server/components/Coordinates";
import {getShip} from "../plugins/ship/utils";
import {getOrbitPosition} from "server/helpers/getOrbitPosition";
import {Vector3} from "three";
import {IsWaypointComponent} from "server/components/isWaypoint";
import {IdentityComponent} from "server/components/identity";
import {PositionComponent} from "server/components/position";
import {InterstellarPositionComponent} from "server/components/ship/interstellarPosition";
import {TagsComponent} from "server/components/tags";

function getCompletePositionFromOrbit(object: Entity) {
  const origin = new Vector3(0, 0, 0);
  if (object.satellite) {
    if (object.satellite.parentId) {
      const parent = App.activeFlight?.ecs.entities.find(
        e => e.id === object.satellite?.parentId
      );
      if (parent?.satellite) {
        const parentPosition = getOrbitPosition({
          radius: parent.satellite.distance,
          eccentricity: parent.satellite.eccentricity,
          orbitalArc: parent.satellite.orbitalArc,
          orbitalInclination: parent.satellite.orbitalInclination,
        });
        origin.copy(parentPosition);
      }
    }
    const position = getOrbitPosition({
      radius: object.satellite.distance,
      eccentricity: object.satellite.eccentricity,
      orbitalArc: object.satellite.orbitalArc,
      orbitalInclination: object.satellite.orbitalInclination,
      origin,
    });
    return position;
  }
  return new Vector3();
}

function getObjectOffsetPosition(object: Entity, ship: Entity) {
  const objectCenter = new Vector3();
  if (object.satellite) {
    objectCenter.copy(getCompletePositionFromOrbit(object));
  } else if (object.position) {
    objectCenter.set(object.position.x, object.position.y, object.position.z);
  } else {
    throw new Error(
      "Invalid object - there is no way to determine the object's position."
    );
  }
  let objectAngle = new Vector3(0, 0, 1);
  const shipPosition = new Vector3(
    ship.position?.x,
    ship.position?.y,
    ship.position?.z
  );
  // Determine the angle between the ship's location and the waypoint
  const objectSystem = getObjectSystem(object);
  if (
    objectSystem?.id === ship.interstellarPosition?.systemId ||
    (!objectSystem?.id && !ship.interstellarPosition?.systemId)
  ) {
    // The waypoint is in the same system as the ship or both the waypoint and ship are in interstellar space.
    objectAngle.subVectors(shipPosition, objectCenter).normalize();
  } else if (
    object.interstellarPosition?.systemId &&
    !ship.interstellarPosition?.systemId
  ) {
    // The ship is in interstellar space, but the waypoint is in a system.
    // Get the angle between the ship's position  and  the system's position.
    const system = App.activeFlight?.ecs.entities.find(
      e => e.id === object.interstellarPosition?.systemId
    );
    if (!system) {
      // This is an unlikely case, so we'll just do nothing. It won't be the end of the world.
    } else {
      objectAngle
        .subVectors(
          shipPosition,
          new Vector3(
            system.position?.x,
            system.position?.y,
            system.position?.z
          )
        )
        .normalize();
    }
  } else if (
    !object.interstellarPosition?.systemId &&
    ship.interstellarPosition?.systemId
  ) {
    // The object is in interstellar space while the ship is in a system; use the angle from the ship's system
    // to the object.
    const system = App.activeFlight?.ecs.entities.find(
      e => e.id === ship.interstellarPosition?.systemId
    );
    if (!system) {
      // This is an unlikely case, so we'll just do nothing. It won't be the end of the world.
    } else {
      objectAngle
        .subVectors(
          new Vector3(
            system.position?.x,
            system.position?.y,
            system.position?.z
          ),
          objectCenter
        )
        .normalize();
    }
  }

  if (!object.interstellarPosition?.systemId && object.planetarySystem) {
    // If the object is a planetary system, just use the actual position of the system.
    // You can't crash into a system ;)
    return objectCenter;
  } else {
    // Take the vector that we've calculated and set the waypoint position along that line
    // with a bit of distance. The distance is proportional to the radius of the object itself
    // and the size of the ship: distanceFromCenter = crewShipSize * 2 + objectSize * 0.5
    const SUN_RADIUS = 696_340;
    const objectSize =
      object.size?.value ||
      object.isPlanet?.radius ||
      (object.isStar?.radius || 0) * SUN_RADIUS ||
      1;
    const distanceFromCenter = (ship.size?.value || 1) * 2 + objectSize * 1.25;
    return objectAngle.multiplyScalar(distanceFromCenter).add(objectCenter);
  }
}
function getObjectSystem(obj: Entity): Entity | null {
  const objSystemId = obj.interstellarPosition?.systemId;
  if (objSystemId) {
    const parentObject = App.activeFlight?.ecs.entities.find(
      e => e.id === objSystemId
    );
    if (parentObject) return parentObject;
  }

  if (obj?.planetarySystem) return obj;
  const parentObjId = obj?.satellite?.parentId;
  const parent = App.activeFlight?.ecs.entities.find(e => e.id === parentObjId);
  if (!parent) return null;
  return getObjectSystem(parent);
}
@Resolver()
export class WaypointsResolver {
  @Subscription(returns => Entity, {
    topics: ({context}: {context: GraphQLContext}) => {
      const id = uuid();
      const waypoints = App.activeFlight?.ecs.entities.filter(
        s => s.isWaypoint?.assignedShipId === context.client?.shipId
      );
      if (context.client?.shipId) {
        process.nextTick(() => {
          pubsub.publish(id, {
            shipId: context.client?.shipId,
            waypoints,
          });
        });
      }
      return [id, "playerShipWaypoints"];
    },
    filter: ({
      context,
      payload,
    }: {
      context: GraphQLContext;
      payload: {shipId: string};
    }) => {
      if (context.client?.shipId !== payload.shipId) return false;
      return true;
    },
  })
  playerShipWaypoints(
    @Root() payload: {waypoints: Entity[]},
    @Ctx() context: GraphQLContext
  ) {
    return payload.waypoints;
  }
  @Mutation(returns => Entity)
  waypointSpawn(
    @Arg("shipId", type => ID, {nullable: true}) shipId: string | null,
    @Arg("systemId", type => ID, {
      nullable: true,
      description: "Use null for waypoints in interstellar space",
    })
    systemId: string | null,
    @Arg("position", type => Coordinates, {nullable: true})
    position: Coordinates | null,
    @Arg("objectId", type => ID, {nullable: true}) objectId: string | null,
    @Ctx() context: GraphQLContext
  ): Entity {
    shipId = shipId || context.client?.shipId || null;
    if (!shipId) throw new Error("No ship selected.");

    if (!position && !objectId)
      throw new Error("Either position or objectId are required");
    const {ship} = getShip({shipId});
    // TODO: Check to see if there is already a waypoint for that ship and object.
    // If there is, just adjust the position of the existing waypoint.
    const object = App.activeFlight?.ecs.entities.find(e => e.id === objectId);
    if (!position) {
      if (!object) throw new Error("Unable to find object");
      position = getObjectOffsetPosition(object, ship);
    }

    const maybeWaypoint = App.activeFlight?.ecs.entities.find(
      e =>
        e.isWaypoint?.assignedShipId === shipId &&
        e.isWaypoint.attachedObjectId === object?.id
    );
    if (maybeWaypoint) {
      maybeWaypoint.updateComponent("position", position);
      const waypoints = App.activeFlight?.ecs.entities.filter(
        s => s.isWaypoint?.assignedShipId === shipId
      );
      pubsub.publish("playerShipWaypoints", {
        shipId,
        waypoints,
      });

      const subSystemId = maybeWaypoint.interstellarPosition?.systemId;
      const system = App.activeFlight?.ecs.entities.find(
        e => e.id === subSystemId
      );
      pubsub.publish("universeSystem", {
        id: subSystemId,
        system,
      });
      return maybeWaypoint;
    }
    const newWaypoint = new Entity(null, [
      IsWaypointComponent,
      IdentityComponent,
      TagsComponent,
      PositionComponent,
      InterstellarPositionComponent,
    ]);
    // If we have an object, set the name to the name of that object
    if (object?.identity?.name) {
      // TODO: INTL in the server here.
      newWaypoint.updateComponent("identity", {
        name: `${object.identity.name} Waypoint`,
      });
    } else {
      // Count up the highest waypoint count and use that.
      const waypointNum =
        1 +
        (App.activeFlight?.ecs.entities || []).reduce((prev, next) => {
          if (next.isWaypoint?.assignedShipId === shipId) {
            const nameWords = next.identity?.name.split(" ") || [];
            const num = parseInt(nameWords[nameWords.length - 1], 10);
            if (!num || num < prev) return prev;
            return num;
          }
          return prev;
        }, 0);
      newWaypoint.updateComponent("identity", {
        name: `Waypoint ${waypointNum}`,
      });
    }
    newWaypoint.updateComponent("isWaypoint", {
      assignedShipId: shipId,
      attachedObjectId: objectId || undefined,
    });
    newWaypoint.updateComponent("position", position);

    // Get the system that the waypoint is in
    let actualSystemId = systemId;
    if (!actualSystemId && object) {
      const sys = getObjectSystem(object);
      const maybeSystemId = sys?.id || null;
      if (!maybeSystemId)
        throw new Error("Error identifying system for waypoint.");
      actualSystemId = maybeSystemId;
    }
    newWaypoint.updateComponent("interstellarPosition", {
      systemId: actualSystemId,
    });

    App.activeFlight?.ecs.addEntity(newWaypoint);

    const waypoints = App.activeFlight?.ecs.entities.filter(
      s => s.isWaypoint?.assignedShipId === shipId
    );
    pubsub.publish("playerShipWaypoints", {
      shipId,
      waypoints,
    });

    const subSystemId = newWaypoint.interstellarPosition?.systemId;
    const system = App.activeFlight?.ecs.entities.find(
      e => e.id === subSystemId
    );
    pubsub.publish("universeSystem", {
      id: subSystemId,
      system,
    });

    return newWaypoint;
  }
  @Mutation(returns => String, {nullable: true})
  waypointRemove(@Arg("id", type => ID) id: string) {
    const waypoint = App.activeFlight?.ecs.entities.find(e => e.id === id);
    if (!waypoint) return;
    const waypoints = App.activeFlight?.ecs.entities.filter(
      s => s.isWaypoint?.assignedShipId === waypoint.isWaypoint?.assignedShipId
    );
    App.activeFlight?.ecs.removeEntityById(id);
    pubsub.publish("playerShipWaypoints", {
      shipId: waypoint.isWaypoint?.assignedShipId,
      waypoints,
    });
    return;
  }
}

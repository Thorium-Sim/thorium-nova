import type {Coordinates, Kilometer} from "@server/utils/unitTypes";
import {Vector3} from "three";

const dirVector1 = new Vector3();
const dirVector2 = new Vector3();
const HELIOPAUSE_DISTANCE_KM: Kilometer = 20_000_000_000;

export function getWaypointRelativePosition(
  entityPosition: Coordinates<number>,
  entitySystem: number | null,
  entitySystemPosition: Coordinates<number> | null,
  playerSystemPosition: Coordinates<number> | null,
  playerSystem: number | null,
  waypointVector: Vector3
) {
  if (entitySystem === playerSystem && entityPosition) {
    // They are in the same system, or they are both in interstellar space
    waypointVector.set(entityPosition.x, entityPosition.y, entityPosition.z);
  } else {
    // Either the ship is in interstellar space, the waypoint is in interstellar space, or the waypoint is in a different system.
    if (playerSystem === null && entitySystemPosition) {
      // The ship is in interstellar space
      // Just use the waypoint's interstellar position
      waypointVector.set(
        entitySystemPosition.x,
        entitySystemPosition.y,
        entitySystemPosition.z
      );
    } else if (entitySystemPosition && playerSystemPosition) {
      // The waypoint is in a different system or
      // The waypoint is in interstellar space
      // Position the waypoint such that it is at a distant point along the vector
      // from this system's position to the waypoint's interstellar position
      dirVector1.set(
        playerSystemPosition.x,
        playerSystemPosition.y,
        playerSystemPosition.z
      );
      dirVector2.set(
        entitySystemPosition.x,
        entitySystemPosition.y,
        entitySystemPosition.z
      );
      waypointVector
        .subVectors(dirVector2, dirVector1)
        .normalize()
        .multiplyScalar(HELIOPAUSE_DISTANCE_KM);
    } else {
      console.error(
        "For some reason, we do not have positions for placing a waypoint"
      );
    }
  }
}

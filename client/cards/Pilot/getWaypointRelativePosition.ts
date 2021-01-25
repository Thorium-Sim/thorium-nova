import {Vector3} from "three";

const dirVector1 = new Vector3();
const dirVector2 = new Vector3();
const HELIOPAUSE_DISTANCE_KM = 20_000_000_000;

interface Position {
  x: number;
  y: number;
  z: number;
}
interface Entity {
  interstellarPosition?: {
    system?: {id: string; position: Position | null} | null;
  } | null;
  position: Position | null;
}

export function getWaypointRelativePosition(
  entity: Entity,
  playerShip: Entity,
  waypointVector: Vector3
) {
  if (
    entity.interstellarPosition?.system?.id ===
      playerShip.interstellarPosition?.system?.id &&
    entity.position
  ) {
    // They are in the same system, or they are both in interstellar space
    waypointVector.set(entity.position.x, entity.position.y, entity.position.z);
  } else {
    // Either the ship is in interstellar space, the waypoint is in interstellar space, or the waypoint is in a different system.
    if (
      !playerShip.interstellarPosition?.system?.id &&
      entity.interstellarPosition?.system?.position
    ) {
      // The ship is in interstellar space
      // Just use the waypoint's interstellar position
      waypointVector.set(
        entity.interstellarPosition.system.position.x,
        entity.interstellarPosition.system.position.y,
        entity.interstellarPosition.system.position.z
      );
    } else if (
      entity.interstellarPosition?.system?.position &&
      playerShip.interstellarPosition?.system?.position
    ) {
      // The waypoint is in a different system or
      // The waypoint is in interstellar space
      // Position the waypoint such that it is at a distant point along the vector
      // from this system's position to the waypoint's interstellar position
      dirVector1.set(
        playerShip.interstellarPosition.system.position.x,
        playerShip.interstellarPosition.system.position.y,
        playerShip.interstellarPosition.system.position.z
      );
      dirVector2.set(
        entity.interstellarPosition.system.position.x,
        entity.interstellarPosition.system.position.y,
        entity.interstellarPosition.system.position.z
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

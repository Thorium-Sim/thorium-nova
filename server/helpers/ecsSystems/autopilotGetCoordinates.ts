import {Vector3} from "three";
import Entity from "../ecs/entity";

export function autopilotGetCoordinates(
  entities: Entity[],
  entity: Entity,
  desiredDestination: Vector3,
  positionVec: Vector3
): boolean {
  const {position, rotation, autopilot} = entity.components;
  if (
    !position ||
    !rotation ||
    !autopilot?.forwardAutopilot ||
    !autopilot?.desiredCoordinates
  )
    return false;
  const shipSystem = entities.find(
    e => e.id === entity.interstellarPosition?.systemId
  );
  const autopilotDesiredSystem = entities.find(
    e => e.id === autopilot.desiredInterstellarSystemId
  );
  if (
    autopilotDesiredSystem?.id === entity.interstellarPosition?.systemId ||
    (!autopilotDesiredSystem && !entity.interstellarPosition?.systemId)
  ) {
    // Within the system or within interstellar space.
    if (autopilot.desiredCoordinates) {
      desiredDestination.set(
        autopilot.desiredCoordinates?.x,
        autopilot.desiredCoordinates?.y,
        autopilot.desiredCoordinates?.z
      );
    }
    positionVec.set(position.x, position.y, position.z);
    return !entity.interstellarPosition?.systemId;
  } else if (!autopilotDesiredSystem) {
    // From within a system to some random point in interstellar space
    if (autopilot.desiredCoordinates) {
      desiredDestination.set(
        autopilot.desiredCoordinates?.x,
        autopilot.desiredCoordinates?.y,
        autopilot.desiredCoordinates?.z
      );
    }
    if (shipSystem?.position) {
      positionVec.set(
        shipSystem.position.x,
        shipSystem.position.y,
        shipSystem.position.z
      );
    }
    return false;
  } else {
    // From within one system to within another system
    if (autopilotDesiredSystem.position) {
      desiredDestination.set(
        autopilotDesiredSystem.position.x,
        autopilotDesiredSystem.position.y,
        autopilotDesiredSystem.position.z
      );
    }
    if (shipSystem?.position) {
      positionVec.set(
        shipSystem.position.x,
        shipSystem.position.y,
        shipSystem.position.z
      );
      return false;
    } else {
      // We are in interstellar space now, going to a system
      positionVec.set(position.x, position.y, position.z);
      return true;
    }
  }
}

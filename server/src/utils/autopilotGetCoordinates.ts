import {Vector3} from "three";
import type {Entity} from "./ecs";

export function autopilotGetCoordinates(
  entity: Entity,
  shipSystem: Entity | null,
  autopilotDesiredSystem: Entity | null,
  desiredDestination: Vector3,
  positionVec: Vector3
): boolean {
  const {position, rotation, autopilot} = entity.components;
  if (!position || !rotation || !autopilot?.desiredCoordinates) return false;
  if (
    autopilotDesiredSystem?.id === entity.components.position?.parentId ||
    (!autopilotDesiredSystem && !entity.components.position?.parentId)
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
    return !entity.components.position?.parentId;
  } else if (!autopilotDesiredSystem) {
    // From within a system to some random point in interstellar space
    if (autopilot.desiredCoordinates) {
      desiredDestination.set(
        autopilot.desiredCoordinates?.x,
        autopilot.desiredCoordinates?.y,
        autopilot.desiredCoordinates?.z
      );
    }
    if (shipSystem?.components.position) {
      positionVec.set(
        shipSystem.components.position.x,
        shipSystem.components.position.y,
        shipSystem.components.position.z
      );
    }
    return false;
  } else {
    // From within one system to within another system
    if (autopilotDesiredSystem.components.position) {
      desiredDestination.set(
        autopilotDesiredSystem.components.position.x,
        autopilotDesiredSystem.components.position.y,
        autopilotDesiredSystem.components.position.z
      );
    }
    if (shipSystem?.components.position) {
      positionVec.set(
        shipSystem.components.position.x,
        shipSystem.components.position.y,
        shipSystem.components.position.z
      );
      return false;
    } else {
      // We are in interstellar space now, going to a system
      positionVec.set(position.x, position.y, position.z);
      return true;
    }
  }
}

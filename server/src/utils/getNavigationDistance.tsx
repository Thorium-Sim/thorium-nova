import {lightMinuteToLightYear} from "@server/utils/unitTypes";

export function getNavigationDistance(
  object: {x: number; y: number; z: number},
  shipPosition: {x: number; y: number; z: number} | null,
  objectSystem: {x: number; y: number; z: number; id: number} | null,
  shipSystem: {x: number; y: number; z: number; id: number} | null
) {
  if (!shipPosition) return null;
  let distance = 0;
  // Interstellar distances OR they are in the same system
  if (objectSystem?.id === shipSystem?.id) {
    distance = Math.hypot(
      object.x - shipPosition.x,
      object.y - shipPosition.y,
      object.z - shipPosition.z
    );
    if (objectSystem?.id) {
      // Inside a solar system
      return {distance, unit: "KM"};
    }
  }
  // The ship is in interstellar space, calculate the distance from the ship to the object's system.
  if (!shipSystem && objectSystem) {
    distance = Math.hypot(
      shipPosition.x - objectSystem.x,
      shipPosition.y - objectSystem.y,
      shipPosition.z - objectSystem.z
    );
  }
  // The ship is in a system and the object is in interstellar space.
  if (shipSystem && !objectSystem) {
    distance = Math.hypot(
      object.x - shipSystem.x,
      object.y - shipSystem.y,
      object.z - shipSystem.z
    );
  }
  return {distance: lightMinuteToLightYear(distance), unit: "LY"};
}

import type { position as TPosition } from "@thorium/ecs-components/position";
import { Vector3 } from "three";
import type { z } from "zod";

import type { Entity } from "../ecs";
import { solarRadiusToKilometers, type SolarRadius } from "../unitTypes";
import { getOrbitPosition } from "./getOrbitPosition";
/** Gets a point that is some distance from object, in the direction of ship. Used for setting waypoints. */
export function getObjectOffsetPosition(
	object: Entity,
	position: z.infer<typeof TPosition>,
	distance: number,
) {
	const objectCenter = new Vector3();
	if (object.components.satellite) {
		objectCenter.copy(getCompletePositionFromOrbit(object));
	} else if (object.components.position) {
		objectCenter.set(
			object.components.position.x,
			object.components.position.y,
			object.components.position.z,
		);
	} else {
		throw new Error("Unable to determine object's position.");
	}
	const objectAngle = new Vector3(0, 0, 1);
	const shipPosition = new Vector3(position.x, position.y, position.z);
	// Determine the angle between the ship's location and the waypoint
	const objectSystem = getObjectSystem(object);
	if (objectSystem?.id === position.parentId || (!objectSystem?.id && !position.parentId)) {
		// The waypoint is in the same system as the ship or both the waypoint and ship are in interstellar space.
		objectAngle.subVectors(shipPosition, objectCenter).normalize();
	} else if (objectSystem && !position.parentId) {
		// The ship is in interstellar space, but the waypoint is in a system.
		// Get the angle between the ship's position  and  the system's position.
		const system = object.ecs?.getEntityById(object.components.position?.parentId || -1);
		if (!system) {
			// This is an unlikely case, so we'll just do nothing. It won't be the end of the world.
		} else {
			objectAngle
				.subVectors(
					shipPosition,
					new Vector3(
						system.components.position?.x,
						system.components.position?.y,
						system.components.position?.z,
					),
				)
				.normalize();
		}
	} else if (!objectSystem && position.parentId) {
		// The object is in interstellar space while the ship is in a system; use the angle from the ship's system
		// to the object.
		const system = object.ecs?.getEntityById(position.parentId);
		if (!system) {
			// This is an unlikely case, so we'll just do nothing. It won't be the end of the world.
		} else {
			objectAngle
				.subVectors(
					new Vector3(
						system.components.position?.x,
						system.components.position?.y,
						system.components.position?.z,
					),
					objectCenter,
				)
				.normalize();
		}
	}

	if (!objectSystem && object.components.isSolarSystem) {
		// If the object is a planetary system, just use the actual position of the system.
		// You can't crash into a system ;)
		return objectCenter;
	}
	// Take the vector that we've calculated and set the waypoint position along that line
	// with a bit of distance. The distance is proportional to the radius of the object itself
	// and the size of the ship: distanceFromCenter = crewShipSize * 2 + objectSize * 2
	const objectSize =
		(object.components.size?.length ? object.components.size.length / 1000 : null) ||
		object.components.isPlanet?.radius ||
		solarRadiusToKilometers((object.components.isStar?.radius || 1) as SolarRadius) ||
		1;
	const distanceFromCenter = distance + objectSize * 3;

	return objectAngle.multiplyScalar(distanceFromCenter).add(objectCenter);
}

/** Gets an objects position based on its satellite component, including if it is orbiting another satellite */
export function getCompletePositionFromOrbit(object: Entity) {
	const origin = new Vector3(0, 0, 0);
	if (object.components.satellite) {
		if (object.components.satellite.parentId) {
			const parent = object.ecs?.getEntityById(object.components.satellite?.parentId);
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
	if (object.components.position) {
		return new Vector3(
			object.components.position.x,
			object.components.position.y,
			object.components.position.z,
		);
	}
	return new Vector3();
}

/** Key is the solar system ID */
export const solarSystemsObjects = new Map<number, Map<number, Sphere>>();
export interface Sphere {
	entityId: number;
	radius: number;
	position: Vector3;
}

/** Key is the object ID, value is the solar system ID */
const objectSystem = new Map<number, number>();

/** Gets the system entity which an object resides in, including if it is a satellite */
export function getObjectSystem(obj: Entity): Entity | null {
	if (obj.components.isSolarSystem) return obj;
	if (objectSystem.has(obj.id)) {
		return obj.ecs.getEntityById(objectSystem.get(obj.id)!);
	}
	const objSystemId = obj.components.position?.parentId;
	if (objSystemId) {
		const parentObject = obj.ecs?.getEntityById(objSystemId);
		if (parentObject) {
			cacheSolarSystemPosition(obj, parentObject.id);
			objectSystem.set(obj.id, parentObject.id);
			return parentObject;
		}
	}

	const parentObjId = obj.components?.satellite?.parentId;
	const parent = obj.ecs?.getEntityById(parentObjId || -1);
	if (!parent) return null;
	return getObjectSystem(parent);
}
export function clearObjectSystem(obj: Entity) {
	objectSystem.delete(obj.id);
}

export function updateCachedSolarSystemPosition(entity: Entity) {
	const solarSystemId = getObjectSystem(entity)?.id || -1;
	const cachedEntry = solarSystemsObjects.get(solarSystemId)?.get(entity.id);
	if (entity.components.position) {
		cachedEntry?.position.set(
			entity.components.position.x,
			entity.components.position.y,
			entity.components.position.z,
		);
	}
}
function cacheSolarSystemPosition(entity: Entity, solarSystemId: number) {
	if (!solarSystemId || objectSystem.get(entity.id) !== solarSystemId) {
		// Remove the object from the system it is a part of, if any
		const solarSystemId = objectSystem.get(entity.id) || -1;
		solarSystemsObjects.get(solarSystemId)?.delete(entity.id);
	}
	if (!solarSystemId) {
		return;
	}
	if (!solarSystemsObjects.get(solarSystemId)) {
		solarSystemsObjects.set(solarSystemId, new Map());
	}
	if (solarSystemsObjects.get(solarSystemId)?.get(entity.id)) return;

	let radiusInKilometers = 0;
	if (entity.components.isPlanet) {
		radiusInKilometers = entity.components.isPlanet.radius;
	} else if (entity.components.isStar) {
		radiusInKilometers = solarRadiusToKilometers(entity.components.isStar.radius);
	} else if (entity.components.size) {
		const { width, height, length } = entity.components.size;
		// Convert meters to kilometers
		radiusInKilometers = Math.max(width, height, length) / 2 / 1000;
	}

	// We use spheres for simplicity. This system is mostly just used for pathfinding.
	const object: Sphere = {
		radius: radiusInKilometers,
		entityId: entity.id,
		position: new Vector3(),
	};

	// Get the position and radius of the object in the solar system
	if (entity.components.satellite) {
		object.position.copy(getCompletePositionFromOrbit(entity));
	} else if (entity.components.position) {
		object.position.set(
			entity.components.position.x,
			entity.components.position.y,
			entity.components.position.z,
		);
	} else {
		throw new Error("Unable to determine object's position.");
	}

	solarSystemsObjects.get(solarSystemId)?.set(entity.id, object);
}

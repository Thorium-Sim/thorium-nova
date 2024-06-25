import { Vector3 } from "three";
import type { Entity } from "./ecs";
import { solarRadiusToKilometers } from "./unitTypes";
import { getOrbitPosition } from "./getOrbitPosition";

/** Gets a point that is some distance from object, in the direction of ship. Used for setting waypoints. */
export function getObjectOffsetPosition(object: Entity, ship: Entity) {
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
	const shipPosition = new Vector3(
		ship.components.position?.x,
		ship.components.position?.y,
		ship.components.position?.z,
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
			(e) => e.id === object.components.position?.parentId,
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
						system.components.position?.z,
					),
				)
				.normalize();
		}
	} else if (!objectSystem && ship.components.position?.parentId) {
		// The object is in interstellar space while the ship is in a system; use the angle from the ship's system
		// to the object.
		const system = object.ecs?.entities.find(
			(e) => e.id === ship.components.position?.parentId,
		);
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
		object.components.size?.length ||
		object.components.isPlanet?.radius ||
		solarRadiusToKilometers(object.components.isStar?.radius || 1) ||
		1;
	const distanceFromCenter =
		((ship.components.size?.length || 1) / 1000) * 2 + objectSize * 3;

	return objectAngle.multiplyScalar(distanceFromCenter).add(objectCenter);
}

/** Gets an objects position based on its satellite component, including if it is orbiting another satellite */
export function getCompletePositionFromOrbit(object: Entity) {
	const origin = new Vector3(0, 0, 0);
	if (object.components.satellite) {
		if (object.components.satellite.parentId) {
			const parent = object.ecs?.entities.find(
				(e) => e.id === object.components.satellite?.parentId,
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

/** Gets the system entity which an object resides in, including if it is a satellite */
export function getObjectSystem(obj: Entity): Entity | null {
	const objSystemId = obj.components.position?.parentId;
	if (objSystemId) {
		const parentObject = obj.ecs?.entities.find((e) => e.id === objSystemId);
		if (parentObject) return parentObject;
	}

	if (obj.components.isSolarSystem) return obj;
	const parentObjId = obj.components?.satellite?.parentId;
	const parent = obj.ecs?.entities.find((e) => e.id === parentObjId);
	if (!parent) return null;
	return getObjectSystem(parent);
}

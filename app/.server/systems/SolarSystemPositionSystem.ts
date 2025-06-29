import { type Entity, System } from "@thorium/utils/ecs";
import { getCompletePositionFromOrbit } from "@thorium/utils/starmap/position";
import { solarRadiusToKilometers } from "@thorium/utils/unitTypes";
import { Mesh, type Object3D, SphereGeometry, Vector3 } from "three";

/** Key is the solar system ID */
export const solarSystemsObjects = new Map<number, Map<number, Sphere>>();
/** Key is the object ID, value is the solar system ID */
const objectSystem = new Map<number, number>();

export interface Sphere {
	entityId: number;
	radius: number;
	position: Vector3;
}
export class SolarSystemPositionSystem extends System {
	test(entity: Entity) {
		return !!(entity.components.position || entity.components.satellite);
	}
	update(entity: Entity) {
		// TODO January 2025: This will explode when moons become a thing
		const solarSystemId =
			entity.components.position?.parentId ||
			entity.components.satellite?.parentId;
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
			radiusInKilometers = solarRadiusToKilometers(
				entity.components.isStar.radius,
			);
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
		objectSystem.set(entity.id, solarSystemId);
	}
}

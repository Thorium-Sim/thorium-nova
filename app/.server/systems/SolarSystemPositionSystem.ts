import { type Entity, System } from "@thorium/utils/ecs";
import { updateCachedSolarSystemPosition } from "@thorium/utils/starmap/position";
import { Vector3 } from "three";

/** Key is the solar system ID */
export const solarSystemsObjects = new Map<number, Map<number, Sphere>>();

export interface Sphere {
	entityId: number;
	radius: number;
	position: Vector3;
}
// Create a map of spheres for all of the objects within every solar system
// TODO September 4, 2026 — This could be optimized by only running this once for static objects
// and having entities update their own sphere position whenever they move
export class SolarSystemShipPositionSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return Boolean(
			(entity.components.position || entity.components.satellite) && entity.components.isShip,
		);
	}
	update(entity: Entity) {
		// TODO January 2025: This will explode when moons become a thing
		updateCachedSolarSystemPosition(entity);
	}
}

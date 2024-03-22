import { type Entity, System } from "@server/utils/ecs";
import {
	getCompletePositionFromOrbit,
	getObjectSystem,
} from "@server/utils/position";

export class NearbyObjectsSystem extends System {
	frequency = 5;
	test(entity: Entity) {
		return !!(entity.components.nearbyObjects && entity.components.position);
	}
	update(entity: Entity) {
		const position =
			entity.components.position || getCompletePositionFromOrbit(entity);
		const systemId = getObjectSystem(entity)?.id || null;

		if (!entity.components.nearbyObjects?.objects) {
			entity.updateComponent("nearbyObjects", { objects: new Map() });
		} else {
			entity.components.nearbyObjects?.objects.clear();
		}

		// We'll clear our work every update, but we'll try to reuse as much work from
		// previous iterations as we can.
		for (const object of this.entities) {
			if (object.id === entity.id) continue;
			if (entity.components.nearbyObjects?.objects.has(object.id)) continue;
			if (object.components.nearbyObjects?.objects.has(entity.id)) continue;

			const objectSystemId = getObjectSystem(object)?.id || null;
			if (objectSystemId !== systemId) continue;

			const objectPosition =
				object.components.position || getCompletePositionFromOrbit(object);

			const distance = Math.hypot(
				position.x - objectPosition.x,
				position.y - objectPosition.y,
				position.z - objectPosition.z,
			);

			entity.components.nearbyObjects?.objects.set(object.id, distance);
			object.components.nearbyObjects?.objects.set(entity.id, distance);
		}
	}
}

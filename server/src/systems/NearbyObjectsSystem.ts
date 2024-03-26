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
	preUpdate(_elapsed: number): void {
		this.entities.forEach((entity) => {
			if (!entity.components.nearbyObjects?.objects) {
				entity.updateComponent("nearbyObjects", { objects: new Map() });
			} else {
				entity.components.nearbyObjects?.objects.clear();
			}
		});
	}
	update(entity: Entity) {
		const position =
			entity.components.position || getCompletePositionFromOrbit(entity);
		const systemId = getObjectSystem(entity)?.id || null;

		// We'll clear our work every update.
		for (const object of this.entities) {
			if (object.id === entity.id) continue;
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
		}
	}
}

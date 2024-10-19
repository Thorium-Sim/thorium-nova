import { getSectorNumber, getWorldPosition } from "@server/init/rapier";
import { type Entity, System } from "@server/utils/ecs";
import { getOrbitPosition } from "@server/utils/getOrbitPosition";

export class PhysicsWorldPositionSystem extends System {
	test(entity: Entity) {
		return !!(
			entity.components.physicsWorld &&
			(entity.components.position || entity.components.satellite)
		);
	}
	update(entity: Entity) {
		const position =
			entity.components.position ||
			(entity.components.satellite && {
				...getOrbitPosition(entity.components.satellite),
				parentId: entity.components.satellite.parentId,
			});
		if (!position?.parentId) {
			entity.updateComponent("physicsWorld", { enabled: false });
			return;
		}
		const worldPosition = getWorldPosition(position);
		entity.updateComponent("physicsWorld", {
			location: { ...worldPosition, parentId: position.parentId },
		});
	}
	postUpdate(): void {
		// After all of the world positions have been updated,
		// we can determine which ones should be enabled and
		// which should be disabled.
		const entities = new Map<string, Set<number>>();
		this.entities.forEach((entity) => {
			const { location } = entity.components.physicsWorld || {};
			if (!location) return;
			const key = getSectorNumber(location);
			if (!entities.has(key)) entities.set(key, new Set());
			entities.get(key)?.add(entity.id);
		});
		entities.forEach((entities) => {
			const iterator = entities.values();
			const id = iterator.next().value;
			if (!id) return;
			this.ecs.getEntityById(id)?.updateComponent("physicsWorld", {
				enabled: true,
			});
			for (const entity of iterator) {
				this.ecs
					.getEntityById(entity)
					?.updateComponent("physicsWorld", { enabled: false });
			}
		});
	}
}

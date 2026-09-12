import type { Entity } from "@thorium/utils/ecs";
import System from "@thorium/utils/ecs/system";

export class DisposalSystem extends System {
	static flightMode = ["nova", "legacy"];

	test(entity: Entity) {
		return Boolean(entity.components.disposable);
	}

	update(entity: Entity) {
		let newIds = [];
		for (const parentId of entity.components.disposable?.entityIds || []) {
			if (this.ecs.entities.has(parentId)) {
				newIds.push(parentId);
			}
		}

		entity.updateComponent("disposable", { entityIds: newIds });
		if (newIds.length === 0) {
			this.ecs.removeEntity(entity);
		}
	}
}

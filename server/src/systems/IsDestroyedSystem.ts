import { type Entity, System } from "@server/utils/ecs";
import type { World } from "@thorium-sim/rapier3d-node";

export class IsDestroyedSystem extends System {
	test(entity: Entity) {
		return !!entity.components.isDestroyed;
	}
	update(entity: Entity, elapsed: number) {
		const { timeToDestroy, timer } = entity.components.isDestroyed!;
		if (timeToDestroy > 0) {
			entity.updateComponent("isDestroyed", { timer: timer + elapsed });
			if (timer + elapsed >= timeToDestroy) {
				// Remove the entity from any physics worlds it is a part of
				const handles = entity.components.physicsHandles?.handles as Map<
					number,
					number
				>;
				for (const [worldEntityId, handle] of handles.entries()) {
					const worldEntity = this.ecs.getEntityById(worldEntityId);
					if (!worldEntity) continue;
					const world = worldEntity.components.physicsWorld?.world as World;
					if (!world) continue;
					const body = world.getRigidBody(handle);
					if (!body) continue;
					world.removeRigidBody(body);
				}

				this.ecs.removeEntity(entity);
			}
		}
	}
}

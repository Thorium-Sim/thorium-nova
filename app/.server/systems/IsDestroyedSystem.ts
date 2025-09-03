import { pubsub } from "@thorium/.server/init/pubsub";
import { type Entity, System } from "@thorium/utils/ecs";
import type { World } from "@thorium-sim/rapier3d-node";

export class IsDestroyedSystem extends System {
	static flightMode = ["nova"];
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
				const systemId = entity.components.position?.parentId || null;
				this.ecs.removeEntity(entity);

				if (entity.components.isTorpedo) {
					pubsub.publish.starmapCore.torpedos({
						systemId,
					});
				}
				if (entity.components.isShip) {
					// Also remove all the ship systems and crew
					// TODO April 25, 2025 - Remove Crew
					for (const shipSystem of entity.components.shipSystems?.shipSystems ||
						[]) {
						this.ecs.removeEntityById(shipSystem[0]);
					}
					pubsub.publish.starmapCore.ships({
						systemId,
					});
				}
			}
		}
	}
}

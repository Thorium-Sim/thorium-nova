import { generateRigidBody, getEntityWorld, getSectorNumber } from "@thorium/.server/init/rapier";
import type { Entity } from "@thorium/utils/ecs";
import System from "@thorium/utils/ecs/system";

/** Ensure that every entity that needs one has a body in its physics world */
export class PhysicsBodySystem extends System {
	test(entity: Entity) {
		return Boolean(
			(entity.components.position && entity.components.velocity) ||
			(entity.components.rotation && entity.components.rotationVelocity),
		);
	}
	update(entity: Entity) {
		const world = getEntityWorld(entity);
		if (!world) return;

		const position = entity.components.position;
		if (!position) return;

		const handles = entity.components.physicsHandles?.handles || new Map();

		const worldSector = getSectorNumber(position);

		// Make sure the entity in question has a corresponding body in the physics world.
		const handle = handles.get(worldSector);

		if (!handle) {
			const body = generateRigidBody(world, entity, this.ecs.colliderCache) || null;
			if (typeof body?.handle === "number") {
				handles?.set(worldSector, body.handle);
				entity.updateComponent("physicsHandles", { handles });
			}
		}
	}
}

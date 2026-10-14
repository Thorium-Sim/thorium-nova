import type { Entity } from "@thorium/utils/ecs";
import System from "@thorium/utils/ecs/system";
import { getRigidBody } from "@thorium/utils/physics/getRigidBody";
import { getPhysicsWorld } from "@thorium/utils/physics/world";
import { rigidBody } from "crashcat";

/** Ensure that every entity that needs one has a body in its physics world */
export class PhysicsBodySystem extends System {
	static flightMode = ["nova"];

	test(entity: Entity) {
		return Boolean(entity.components.physicsHandles);
	}
	exit(entity: Entity) {
		for (const [systemId, handle] of entity.components.physicsHandles?.handles || []) {
			const world = getPhysicsWorld(systemId);
			const body = rigidBody.get(world, handle);
			if (!body) continue;

			rigidBody.remove(world, body);
		}
	}
	update(entity: Entity) {
		const systemId =
			entity.components.position?.parentId || entity.components.satellite?.parentId || -1;

		const handles = entity.components.physicsHandles?.handles || new Map();

		// Make sure the entity in question has a corresponding body in the physics world.
		const handle = handles.get(systemId);

		if (!handle) {
			const body = getRigidBody(entity);
			handles.set(systemId, body.id);
			entity.updateComponent("physicsHandles", { handles });
		}
	}
}

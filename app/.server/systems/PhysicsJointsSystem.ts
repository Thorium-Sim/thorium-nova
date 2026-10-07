import {
	getBodyForEntity,
	getEntityWorld,
	getSectorNumber,
	RAPIER,
} from "@thorium/.server/init/rapier";
import type { Entity } from "@thorium/utils/ecs";
import System from "@thorium/utils/ecs/system";

/** Ensure that every entity has its joints spawned in its physics world */
/**
 * October 7, 2026 — I wasn't able to figure out how to make this work properly,
 * so I'm using simple physics for docked entities and this system is dormant.
 * Someday we might hook it up so we have proper physics.
 */
export class PhysicsJointsSystem extends System {
	static flightMode = ["nova"];

	test(entity: Entity) {
		return !!entity.components.fixedJoint || !!entity.components.springJoint;
	}
	exit(entity: Entity) {
		for (const [worldId, handle] of entity.components.fixedJoint?.handles || new Map()) {
			if (!worldId) continue;
			const worldEntity = this.ecs.getEntityById(worldId);
			if (!worldEntity) continue;
			const world = getEntityWorld(worldEntity);
			if (!world) continue;
			const joint = world.getImpulseJoint(handle);
			if (!joint) continue;
			world.removeImpulseJoint(joint, true);
		}
	}
	update(entity: Entity) {
		if (entity.components.fixedJoint) {
			const { idA, idB } = entity.components.fixedJoint;
			const entityA = this.ecs.getEntityById(idA);
			const entityB = this.ecs.getEntityById(idB);
			if (!entityA) {
				this.ecs.removeEntity(entity);
				return;
			}
			if (!entityB) {
				this.ecs.removeEntity(entity);
				return;
			}
			createJoint(entity);
		}
		if (entity.components.springJoint) {
		}
	}
}

export function createJoint(jointEntity: Entity) {
	const ecs = jointEntity.ecs;

	if (!jointEntity.components.fixedJoint) return;
	const { anchorA, anchorB, frameA, frameB, idA, idB } = jointEntity.components.fixedJoint;

	const handles = jointEntity.components.fixedJoint.handles || new Map();

	const entityA = ecs.getEntityById(idA);
	const entityB = ecs.getEntityById(idB);
	if (!entityA || !entityB) return;

	const position = entityA.components.position;
	if (!position) return;
	const worldSector = getSectorNumber(position);
	const handle = handles.get(worldSector);
	if (typeof handle === "number") return;

	const world = getEntityWorld(entityA);
	if (!world) return;

	const sizeA = entityA.components.size?.length || 1;
	const sizeB = entityB.components.size?.length || 1;

	const params = RAPIER.JointData.fixed(
		{
			x: anchorA.x * sizeA,
			y: anchorA.y * sizeA,
			z: anchorA.z * sizeA,
		},
		frameA,
		{
			x: anchorB.x * sizeB,
			y: anchorB.y * sizeB,
			z: anchorB.z * sizeB,
		},
		frameB,
	);

	const bodyA = getBodyForEntity(entityA);
	const bodyB = getBodyForEntity(entityB);
	if (!bodyA || !bodyB) {
		return;
	}
	const joint = world.createImpulseJoint(params, bodyA, bodyB, true);
	joint.setContactsEnabled(false);
	handles.set(worldSector, joint.handle);
	jointEntity.updateComponent("fixedJoint", { handles });
}

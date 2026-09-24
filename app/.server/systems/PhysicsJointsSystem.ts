import {
	getBodyForEntity,
	getEntityWorld,
	getSectorNumber,
	RAPIER,
} from "@thorium/.server/init/rapier";
import type { Entity } from "@thorium/utils/ecs";
import System from "@thorium/utils/ecs/system";
import { Vector3 } from "three";

const anchorVecA = new Vector3();
const anchorVecB = new Vector3();
/** Ensure that every entity has its joints spawned in its physics world */
export class PhysicsJointsSystem extends System {
	test(entity: Entity) {
		console.log(entity.id, !!entity.components.fixedJoint || !!entity.components.springJoint);
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
			const { anchorA, anchorB, frameA, frameB, idA, idB } = entity.components.fixedJoint;
			const handles = entity.components.fixedJoint.handles || new Map();
			console.log("Found joint");
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
			const position = entityA.components.position;
			if (!position) return;
			const worldSector = getSectorNumber(position);
			const handle = handles.get(worldSector);
			if (handle) return;

			const world = getEntityWorld(entityA);
			if (!world) return;

			anchorVecA
				.set(anchorA.x, anchorA.y, anchorA.z)
				.multiplyScalar(entityA.components.size?.length || 1);
			anchorVecB
				.set(anchorB.x, anchorB.y, anchorB.z)
				.multiplyScalar(entityB.components.size?.length || 1);

			const params = RAPIER.JointData.fixed(anchorVecA, frameA, anchorVecB, frameB);
			console.log({
				anchorVecA: anchorVecA.toArray(),
				frameA,
				anchorVecB: anchorVecB.toArray(),
				frameB,
			});
			const bodyA = getBodyForEntity(this.ecs.getEntityById(idA));
			const bodyB = getBodyForEntity(this.ecs.getEntityById(idB));
			if (!bodyA || !bodyB) {
				console.log("Body not found", !!bodyA, !!bodyB);
				return;
			}

			const joint = world.createImpulseJoint(params, bodyA, bodyB, true);
			joint.setContactsEnabled(false);
			handles.set(worldSector, joint.handle);
			entity.updateComponent("fixedJoint", { handles });
		}
		if (entity.components.springJoint) {
		}
	}
}

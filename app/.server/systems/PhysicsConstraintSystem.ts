import type { Entity } from "@thorium/utils/ecs";
import System from "@thorium/utils/ecs/system";
import { getRigidBody } from "@thorium/utils/physics/getRigidBody";
import { getPhysicsWorld } from "@thorium/utils/physics/world";
import { getObjectSystem } from "@thorium/utils/starmap/position";
import { ConstraintSpace, fixedConstraint } from "crashcat";
import { Quaternion, Vector3 } from "three";

/** Ensure that every entity has its constraint spawned in its physics world */
export class PhysicsConstraintSystem extends System {
	static flightMode = ["nova"];

	test(entity: Entity) {
		return !!entity.components.fixedConstraint || !!entity.components.springConstraint;
	}
	exit(entity: Entity) {
		for (const [systemId, handle] of entity.components.fixedConstraint?.handles || new Map()) {
			if (typeof systemId !== "number") continue;
			const world = getPhysicsWorld(systemId);
			const constraint = fixedConstraint.get(world, handle);
			if (!constraint) continue;
			constraint.enabled = false;
			fixedConstraint.remove(world, constraint);
		}
	}
	update(entity: Entity) {
		if (entity.components.fixedConstraint) {
			const { idA, idB } = entity.components.fixedConstraint;
			const entityA = this.ecs.getEntityById(idA);
			const entityB = this.ecs.getEntityById(idB);
			if (!entityA || !entityB) {
				this.ecs.removeEntity(entity);
				return;
			}
			createFixedConstraint(entity);
		}
		if (entity.components.springConstraint) {
		}
	}
}

const axisY1 = new Vector3();
const body1Quat = new Quaternion();
const axisY2 = new Vector3();
const body2Quat = new Quaternion();

export function createFixedConstraint(constraintEntity: Entity) {
	const ecs = constraintEntity.ecs;

	if (!constraintEntity.components.fixedConstraint) return;
	const { anchorA, anchorB, frameA, frameB, idA, idB } =
		constraintEntity.components.fixedConstraint;

	const handles = constraintEntity.components.fixedConstraint.handles || new Map();

	const entityA = ecs.getEntityById(idA);
	const entityB = ecs.getEntityById(idB);
	if (!entityA || !entityB) return;

	const systemEntity = getObjectSystem(entityA);
	const systemId = systemEntity?.id || -1;
	if (handles.has(systemId)) return;

	const world = getPhysicsWorld(systemId);

	const hostBody = getRigidBody(entityA);
	const guestBody = getRigidBody(entityB);

	const constraint = fixedConstraint.create(world, {
		bodyIdA: hostBody.id,
		bodyIdB: guestBody.id,
		point1: anchorA,
		point2: anchorB,
		// axisX1: [0, 1, 0],
		// axisY1: [1, 0, 0],
		// axisX2: [0, 0, 1],
		// axisY2: [1, 0, 0],
		axisX1: frameA,
		axisY1: axisY1
			.set(0, 1, 0)
			.applyQuaternion(body1Quat.set(...hostBody.quaternion))
			.toArray(),
		axisX2: frameB,
		axisY2: axisY2
			.set(0, 1, 0)
			.applyQuaternion(body2Quat.set(...guestBody.quaternion))
			.toArray(),
		space: ConstraintSpace.LOCAL,
	});

	handles.set(systemId, constraint.id);
	constraintEntity.updateComponent("fixedConstraint", { handles });
}

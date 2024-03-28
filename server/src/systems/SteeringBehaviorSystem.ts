import { type Entity, System } from "@server/utils/ecs";
import { Quaternion, Vector3 } from "three";

/**
 * Ships use this system to navigate the world
 * based on their surroundings. It will likely
 * become more sophisticated as more behaviors
 * are added, and will take in the surroundings
 * of the ship to make decisions.
 * For example:
 * - Avoiding obstacles
 * - Moving in attack formations
 * - Fleeing from danger
 * - Following a leader
 */

const steeringForce = new Vector3();
const impulseMaxSpeed = new Vector3(0, 0, 1);
const rotationQuat = new Quaternion();
const positionVector = new Vector3();
const velocityVector = new Vector3();

const tempVector1 = new Vector3();
const tempVector2 = new Vector3();
export class ShipBehaviorSystem extends System {
	test(entity: Entity) {
		return !!entity.components.shipBehavior;
	}

	update(entity: Entity, elapsed: number) {
		const { shipBehavior, rotation, position, velocity } = entity.components;
		if (!shipBehavior || !rotation || !position || !velocity) return;
		const { objective, target, destination, patrolRadius } = shipBehavior;
		const { impulseEngines, warpEngines, thrusters } =
			getLocomotionShipSystems(entity);
		rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
		impulseMaxSpeed
			.set(0, 0, 1)
			.applyQuaternion(rotationQuat)
			.multiplyScalar(
				getSystemMaxSpeed(
					impulseEngines,
					impulseEngines?.components.isImpulseEngines?.cruisingSpeed || 0,
				),
			);
		const thrustersMaxSpeed = getSystemMaxSpeed(
			thrusters,
			thrusters?.components.isThrusters?.directionMaxSpeed || 0,
		);
	}
}

function seek(position: Vector3, target: Vector3) {
	// This is the desired velocity
	return tempVector1.copy(target).sub(position).normalize();
}
function flee(position: Vector3, target: Vector3) {
	// This is the desired velocity
	return tempVector1.copy(position).sub(target).normalize();
}

function pursue() {}

function evade() {}

function wander() {}

function separation() {}

function leaderAlignment() {}

function cohesion() {}

function getForceFromDesiredVelocity(
	velocity: Vector3,
	maxVelocityVector: Vector3,
	maxVelocityScalar: number,
	maxForceVector: Vector3,
	maxForceScalar: number,
) {
	const maxVelocity = applyMax(velocity, maxVelocityVector, maxVelocityScalar);

	// This is the steering force
	maxVelocity.sub(velocity);

	applyMax(maxVelocity, maxForceVector, maxForceScalar);
	return maxVelocity;
}

function applyMax(vec: Vector3, maxVec: Vector3, maxScalar: number) {
	// This is the max velocity vector
	tempVector2
		.copy(vec)
		// Apply the thruster max speed
		.multiplyScalar(maxScalar)
		// Apply the impulse engine max speed
		.add(vec.multiply(maxVec));

	return vec.copy(tempVector2);
}

function estimateFuturePosition(
	position: Vector3,
	velocity: Vector3,
	time: number,
) {
	return position.clone().add(velocity.clone().multiplyScalar(time));
}

export function getSystemMaxSpeed(
	entity: Entity | null | undefined,
	maxSpeed: number,
) {
	if (!entity) return maxSpeed;
	if (entity.components.power) {
		const { currentPower, maxSafePower, requiredPower } =
			entity.components.power || {};
		return (
			maxSpeed *
			(Math.max(0, currentPower - requiredPower) /
				(maxSafePower - requiredPower))
		);
	}
	return maxSpeed;
}
export function getLocomotionShipSystems(entity: Entity) {
	const [impulseEngines, warpEngines, thrusters] =
		entity.ecs?.entities.reduce(
			(acc: [Entity | null, Entity | null, Entity | null], sysEntity) => {
				if (
					!acc[0] &&
					sysEntity.components.isImpulseEngines &&
					entity.components.shipSystems?.shipSystems.has(sysEntity.id)
				)
					return [sysEntity, acc[1], acc[2]];
				if (
					!acc[1] &&
					sysEntity.components.isWarpEngines &&
					entity.components.shipSystems?.shipSystems.has(sysEntity.id)
				)
					return [acc[0], sysEntity, acc[2]];
				if (
					!acc[2] &&
					sysEntity.components.isThrusters &&
					entity.components.shipSystems?.shipSystems.has(sysEntity.id)
				)
					return [acc[0], acc[1], sysEntity];
				return acc;
			},
			[null, null, null],
		) || [];

	return { impulseEngines, warpEngines, thrusters };
}

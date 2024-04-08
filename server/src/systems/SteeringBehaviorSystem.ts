import { impulse } from "@client/data/plugins/systems/impulse";
import { type Entity, System } from "@server/utils/ecs";
import {
	getObjectOffsetPosition,
	getObjectPosition,
} from "@server/utils/position";
import { randomPointInSphere } from "@thorium/randomPoint/randomPointInSphere";
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
const forwardVector = new Vector3(0, 0, 1);
const impulseMaxSpeed = new Vector3(0, 0, 1);
const impulseMaxForce = new Vector3(0, 0, 1);
const rotationQuat = new Quaternion();
const desiredRotationQuat = new Quaternion();
const positionVector = new Vector3();
const targetVector = new Vector3();
const destinationVector = new Vector3();
const velocityVector = new Vector3();
const desiredVelocity = new Vector3();

const tempVector1 = new Vector3();
const tempVector2 = new Vector3();
export class SteeringBehaviorSystem extends System {
	test(entity: Entity) {
		return !!entity.components.shipBehavior;
	}

	update(entity: Entity, elapsed: number) {
		const elapsedInSeconds = elapsed / 1000;

		const { shipBehavior, rotation, position, velocity, size, isPlayerShip } =
			entity.components;
		if (!shipBehavior || !rotation || !position || !velocity) return;

		const {
			objective,
			target,
			destination,
			patrolRadius,
			behaviorCooldownSeconds,
			wanderPoint,
		} = shipBehavior;
		const { impulseEngines, warpEngines, thrusters } =
			getLocomotionShipSystems(entity);
		rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
		forwardVector.set(0, 0, 1).applyQuaternion(rotationQuat);

		if (
			isPlayerShip &&
			!shipBehavior.rotationAutopilot &&
			!shipBehavior.forwardAutopilot
		) {
			impulseEngines?.updateComponent("isImpulseEngines", {
				forwardForce: 0,
			});
			return;
		}

		impulseMaxSpeed
			.copy(forwardVector)
			.multiplyScalar(
				getSystemMaxSpeed(
					impulseEngines,
					impulseEngines?.components.isImpulseEngines?.cruisingSpeed || 0,
				),
			);

		impulseMaxForce
			.copy(forwardVector)
			.multiplyScalar(impulseEngines?.components.isImpulseEngines?.thrust || 0);

		const thrustersMaxSpeed = getSystemMaxSpeed(
			thrusters,
			thrusters?.components.isThrusters?.directionMaxSpeed || 0,
		);
		const thrustersMaxForce =
			thrusters?.components.isThrusters?.directionThrust || 0;

		const maxSpeed = Math.max(impulseMaxSpeed.length(), thrustersMaxSpeed);

		const targetPosition =
			typeof target === "number"
				? this.ecs.getEntityById(target)
					? getObjectPosition(this.ecs.getEntityById(target)!)
					: position
				: target || position;

		// Get the desired velocity
		positionVector.set(position.x, position.y, position.z);
		velocityVector.set(velocity.x, velocity.y, velocity.z);
		targetVector.set(targetPosition.x, targetPosition.y, targetPosition.z);
		destinationVector.set(
			destination?.x || 0,
			destination?.y || 0,
			destination?.z || 0,
		);
		desiredVelocity.set(0, 0, 0);
		steeringForce.set(0, 0, 0);

		const shipLengthInKm = (size?.length || 1000) / 1000;

		switch (objective) {
			case "hold": {
				// Set the destination to the target position
				entity.updateComponent("shipBehavior", {
					destination: {
						parentId: targetPosition.parentId,
						x: targetPosition.x,
						y: targetPosition.y,
						z: targetPosition.z,
					},
				});
				desiredVelocity.add(arrival(positionVector, targetVector, maxSpeed));
				break;
			}
			case "patrol": {
				desiredVelocity.add(
					arrival(positionVector, destinationVector, maxSpeed),
				);
				if (!destination || positionVector.distanceTo(destinationVector) < 5) {
					entity.updateComponent("shipBehavior", {
						behaviorCooldownSeconds: behaviorCooldownSeconds - elapsedInSeconds,
					});
				}
				if (behaviorCooldownSeconds <= 0) {
					const [x, y, z] = randomPointInSphere(patrolRadius);
					destinationVector.set(x, y, z).add(targetVector);
					entity.updateComponent("shipBehavior", {
						behaviorCooldownSeconds: 10,
						destination: {
							parentId: destination?.parentId || null,
							x: destinationVector.x,
							y: destinationVector.y,
							z: destinationVector.z,
						},
					});
				}
				break;
			}
			case "wander": {
				const { lat, lon } = wanderPoint;
				const { desiredVelocity: wanderVelocity, offset } = wander(
					positionVector,
					velocityVector,
					shipLengthInKm * 2,
					shipLengthInKm * 5,
					{ lat, lon },
				);
				entity.updateComponent("shipBehavior", {
					wanderPoint: {
						lat: offset.lat,
						lon: offset.lon,
					},
				});
				desiredVelocity.add(wanderVelocity);
				break;
			}
			case "defend": {
				// We only defend other entities
				if (!target || typeof target !== "number") {
					entity.updateComponent("shipBehavior", {
						objective: "hold",
					});
					break;
				}
				const targetEntity = this.ecs.getEntityById(target);
				if (!targetEntity) {
					entity.updateComponent("shipBehavior", {
						objective: "hold",
					});
					break;
				}
				const velocity = targetEntity.components.velocity || {
					x: 0,
					y: 0,
					z: 0,
				};
				velocityVector.set(velocity.x, velocity.y, velocity.z);

				const neighbors: {
					distance: number;
					position: { x: number; y: number; z: number };
				}[] = [];
				entity.components.nearbyObjects?.objects.forEach(
					(distance: number, id: number) => {
						const entity = this.ecs.getEntityById(id);
						if (!entity) return;
						const position = getObjectPosition(entity);
						neighbors.push({ distance, position });
					},
				);

				desiredVelocity.add(
					leaderFollowing(
						positionVector,
						maxSpeed,
						shipLengthInKm,
						targetVector,
						velocityVector,
						neighbors,
					),
				);
				break;
			}
			case "attack": {
				// We only attack other entities
				if (!target || typeof target !== "number") {
					entity.updateComponent("shipBehavior", {
						objective: "hold",
					});
					break;
				}
				const targetEntity = this.ecs.getEntityById(target);
				if (!targetEntity) {
					entity.updateComponent("shipBehavior", {
						objective: "hold",
					});
					break;
				}
				const velocity = targetEntity.components.velocity || {
					x: 0,
					y: 0,
					z: 0,
				};
				velocityVector.set(velocity.x, velocity.y, velocity.z);

				desiredVelocity.add(
					pursue(positionVector, targetVector, velocityVector, 1),
				);
			}
		}

		// Update the rotation thrusters to turn the ship towards the desired velocity
		// Calculate the shortest arc between the forward vector and the desired velocity
		tempVector2.crossVectors(forwardVector, desiredVelocity);
		console.log(forwardVector, desiredVelocity, tempVector2);
		desiredRotationQuat
			.set(
				tempVector2.x,
				tempVector2.y,
				tempVector2.z,
				Math.sqrt(
					forwardVector.lengthSq() * desiredVelocity.lengthSq() +
						forwardVector.dot(desiredVelocity),
				),
			)
			.normalize();

		// Yaw, Pitch, and Roll calculations
		const { x, y, z, w } = desiredRotationQuat;
		const roll = Math.asin(2 * x * y + 2 * z * w);
		const pitch = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * x * x - 2 * z * z);
		const yaw = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * y * y - 2 * z * z);
		thrusters?.updateComponent("isThrusters", {
			rotationDelta: {
				z: 0,
				y: yaw,
				x: pitch,
			},
		});

		if (isPlayerShip && !shipBehavior.forwardAutopilot) {
			impulseEngines?.updateComponent("isImpulseEngines", {
				forwardForce: 0,
			});
			return;
		}
		// Calculate the steering forces
		steeringForce.copy(
			getForceFromDesiredVelocity(
				velocityVector,
				impulseMaxSpeed,
				thrustersMaxSpeed,
				impulseMaxForce,
				thrustersMaxForce,
			),
		);

		// Activate the impulse engines according to the component of the steering force that corresponds to the forward vector
		// of the ship.
		// We take the normalized dot product to figure out how much of the steering force is in the direction of the forward vector.
		const impulsePercent = Math.max(
			0,
			tempVector1
				.copy(forwardVector)
				.normalize()
				.dot(tempVector2.copy(steeringForce).normalize()),
		);
		const forwardForce = steeringForce.length() * impulsePercent;
		impulseEngines?.updateComponent("isImpulseEngines", {
			forwardForce,
		});

		// Subtract the impulse force from the steering force
		forwardVector.normalize().multiplyScalar(impulsePercent);
		steeringForce.sub(forwardVector);

		// Activate the thrusters for the remaining components of the steering force.
		steeringForce.normalize().multiplyScalar(thrustersMaxForce);
		thrusters?.updateComponent("isThrusters", {
			direction: {
				x: steeringForce.x,
				y: steeringForce.y,
				z: steeringForce.z,
			},
		});
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

function arrival(position: Vector3, target: Vector3, maxSpeed: number) {
	const distance = tempVector1.copy(target).sub(position).length();
	const speed = distance / maxSpeed;
	return seek(position, target).multiplyScalar(speed);
}

function pursue(
	position: Vector3,
	target: Vector3,
	targetVelocity: Vector3,
	t: number,
) {
	const futurePosition = estimateFuturePosition(target, targetVelocity, t);
	return seek(position, futurePosition);
}

function evade(
	position: Vector3,
	target: Vector3,
	targetVelocity: Vector3,
	t: number,
) {
	const futurePosition = estimateFuturePosition(target, targetVelocity, t);
	return flee(position, futurePosition);
}

function wander(
	position: Vector3,
	velocity: Vector3,
	wanderDistance: number,
	wanderRadius: number,
	{ lat, lon }: { lat: number; lon: number },
) {
	const wanderPoint = tempVector1
		.copy(velocity)
		.normalize()
		.multiplyScalar(wanderDistance)
		.add(position);

	const displaceRange = 0.2;
	lat += Math.random() * displaceRange - displaceRange / 2;
	lon += Math.random() * displaceRange - displaceRange / 2;

	const x = wanderRadius * Math.sin(lat) * Math.cos(lon);
	const y = wanderRadius * Math.sin(lat) * Math.sin(lon);
	const z = wanderRadius * Math.cos(lat);
	wanderPoint.add(tempVector2.set(x, y, z));

	return { desiredVelocity: seek(position, wanderPoint), offset: { lat, lon } };
}

const otherEntityPosition = new Vector3();

function separation(
	position: Vector3,
	size: number,
	distance: number,
	neighborPosition: { x: number; y: number; z: number },
) {
	// Convert size to kilometers
	const minSafeDistance = (size * 5) / 1000;
	tempVector1.copy(position);
	tempVector2.set(0, 0, 0);

	otherEntityPosition.set(
		neighborPosition.x,
		neighborPosition.y,
		neighborPosition.z,
	);
	if (tempVector1.distanceTo(otherEntityPosition) < minSafeDistance) {
		tempVector2.copy(
			tempVector1.sub(otherEntityPosition).normalize().divideScalar(distance),
		);
	}

	return tempVector2;
}

const separationVelocity = new Vector3();
function leaderFollowing(
	position: Vector3,
	maxSpeed: number,
	size: number,
	leaderPosition: { x: number; y: number; z: number },
	leaderVelocity: { x: number; y: number; z: number },
	neighbors: {
		distance: number;
		position: { x: number; y: number; z: number };
	}[],
) {
	separationVelocity.set(0, 0, 0);
	for (const neighbor of neighbors) {
		separationVelocity.add(
			separation(position, size, neighbor.distance, neighbor.position),
		);
	}

	// Get a position behind the leader
	const behindLeader = tempVector1
		.set(leaderPosition.x, leaderPosition.y, leaderPosition.z)
		.sub(tempVector2.set(leaderVelocity.x, leaderVelocity.y, leaderVelocity.z))
		.normalize()
		.multiplyScalar(5);

	// Get the desired velocity
	return arrival(position, behindLeader, maxSpeed).add(separationVelocity);
}

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

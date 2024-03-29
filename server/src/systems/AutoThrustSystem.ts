import { Quaternion, Vector3, Matrix4 } from "three";
import Controller from "node-pid-controller";
import { type Entity, System } from "../utils/ecs";
import { autopilotGetCoordinates } from "../utils/autopilotGetCoordinates";
import {
	kilometerToLightMinute,
	KM_TO_LY,
	lightMinuteToLightYear,
	lightYearToLightMinute,
	Radian,
} from "../utils/unitTypes";
import type { isWarpEngines } from "../components/shipSystems";
import { pubsub } from "@server/init/pubsub";

const positionVec = new Vector3();
const rotationQuat = new Quaternion();
const desiredDestination = new Vector3();
const emptyVector = new Vector3(0, 0, 0);
const scaleVector = new Vector3(1, 1, 1);
const shipMatrix = new Matrix4();
const lookVector = new Vector3(0, 0, 1);
const up = new Vector3(0, 1, 0);
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
const desiredRotationQuat = new Quaternion();
const steeringForce = new Vector3();

const IMPULSE_PROPORTION = 1;
const IMPULSE_DERIVATIVE = 0.5;
const IMPULSE_INTEGRAL = 0.5;
const WARP_PROPORTION = 1;
const WARP_INTEGRAL = 0.5;
const WARP_DERIVATIVE = 0.5;

const controllerCache = new Map<number, Controller>();

function getWarpController(id?: number) {
	if (!id) return null;
	if (!controllerCache.has(id)) {
		controllerCache.set(
			id,
			new Controller({
				k_d: WARP_DERIVATIVE,
				k_i: WARP_INTEGRAL,
				k_p: WARP_PROPORTION,
				i_max: 1,
			}),
		);
	}
	return controllerCache.get(id);
}

function getImpulseController(id?: number) {
	if (!id) return null;
	if (!controllerCache.has(id)) {
		controllerCache.set(
			id,
			new Controller({
				k_p: IMPULSE_PROPORTION,
				k_d: IMPULSE_DERIVATIVE,
				k_i: IMPULSE_INTEGRAL,
				i_max: 1,
			}),
		);
	}
	return controllerCache.get(id);
}

export class AutoThrustSystem extends System {
	updateCount = 0;
	test(entity: Entity) {
		return !!(
			entity.components.isShip &&
			entity.components.rotation &&
			entity.components.autopilot
		);
	}
	preUpdate() {
		this.updateCount = (this.updateCount + 1) % 3;
	}
	update(entity: Entity, elapsed: number) {
		const { position, rotation, autopilot } = entity.components;
		if (!position || !rotation || !autopilot?.forwardAutopilot) return;

		const [impulseEngines, warpEngines, thrusters] = this.ecs.entities.reduce(
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
		);
		// Get the current system the ship is in and the autopilot desired system
		const entitySystem = entity.components.position?.parentId
			? this.ecs.getEntityById(entity.components.position.parentId)
			: null;
		const destinationSystem = entity.components.autopilot?.desiredSolarSystemId
			? this.ecs.getEntityById(entity.components.autopilot.desiredSolarSystemId)
			: null;

		const isInInterstellar = autopilotGetCoordinates(
			entity,
			entitySystem,
			destinationSystem,
			desiredDestination,
			positionVec,
		);
		positionVec.set(position.x, position.y, position.z);
		rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);

		up.set(0, 1, 0).applyQuaternion(rotationQuat);

		matrix.lookAt(positionVec, desiredDestination, up).multiply(rotationMatrix);
		desiredRotationQuat.setFromRotationMatrix(matrix);

		const distanceInKM =
			positionVec.distanceTo(desiredDestination) *
			(isInInterstellar ? 1 / lightYearToLightMinute(KM_TO_LY) : 1);

		shipMatrix.compose(emptyVector, rotationQuat, scaleVector);
		const rotatedLookVector = lookVector
			.clone()
			.applyMatrix4(shipMatrix)
			.normalize();

		const rotationDifference =
			(Math.abs(rotationQuat.angleTo(desiredRotationQuat)) / Math.PI) * 180;

		const dotProd = rotatedLookVector.dot(
			desiredDestination.clone().normalize(),
		);
		const impulseController = getImpulseController(impulseEngines?.id);
		const warpController = getWarpController(warpEngines?.id);

		if (impulseController) {
			impulseController.target = 1;
		}

		const impulseEngineSpeed =
			impulseEngines?.components.isImpulseEngines?.cruisingSpeed || 1;

		// There's a heuristic here for which engine to choose to reach a given destination.
		// Basically, if it would take 15 seconds or less to reach the destination at cruising
		// impulse speed, we should use that. Otherwise, we should use warp.
		const TRAVEL_TIME_THRESHOLD_SECONDS = 15;

		if (warpController) {
			// We want Warp to get us within 15 seconds at impulse of our destination
			warpController.target =
				impulseEngineSpeed * TRAVEL_TIME_THRESHOLD_SECONDS;
		}

		// This will be 1 if the ship is pointing directly at the destination, and 0 if it's pointing directly away
		const correctDirectionCoefficient = (180 - rotationDifference) / 180;
		const inCorrectDirection = rotationDifference <= 0.5;
		if (
			warpEngines?.components.isWarpEngines &&
			distanceInKM / impulseEngineSpeed > TRAVEL_TIME_THRESHOLD_SECONDS
		) {
			impulseController?.reset();
			impulseEngines?.updateComponent("isImpulseEngines", { targetSpeed: 0 });
			// Use warp engines
			const warpCruisingSpeed = isInInterstellar
				? warpEngines.components.isWarpEngines.interstellarCruisingSpeed
				: warpEngines.components.isWarpEngines.solarCruisingSpeed;
			// Warp is so fast, we'll still require a full rotation before activating.
			if (inCorrectDirection) {
				const controllerOutput = warpController?.update(
					-1 * Math.min(warpCruisingSpeed, distanceInKM),
				);
				const desiredSpeed = Math.min(
					warpCruisingSpeed,
					Math.max(0, controllerOutput || 0),
				);
				// Figure out an appropriate warp factor to get us to that speed.
				const currentWarpFactor = getWarpFactorFromDesiredSpeed(
					desiredSpeed,
					warpEngines.components.isWarpEngines,
					isInInterstellar,
				);
				warpEngines.updateComponent("isWarpEngines", {
					currentWarpFactor,
				});
			} else {
				warpController?.reset();
				warpEngines.updateComponent("isWarpEngines", { currentWarpFactor: 0 });
			}
		} else if (impulseEngines?.components.isImpulseEngines) {
			warpController?.reset();
			warpEngines?.updateComponent("isWarpEngines", {
				currentWarpFactor: 0,
				maxVelocity: 0,
			});
			const controllerOutput = impulseController?.update(
				-1 *
					Math.min(
						impulseEngines.components.isImpulseEngines.cruisingSpeed,
						distanceInKM,
					),
			);
			let desiredSpeed = Math.min(
				impulseEngines.components.isImpulseEngines.cruisingSpeed,
				Math.max(0, controllerOutput || 0) * correctDirectionCoefficient,
			);

			// Arbitrary number that gets roughly close to 5 KM away
			if (distanceInKM < 1) {
				desiredSpeed = 0;
			}
			impulseEngines.updateComponent("isImpulseEngines", {
				targetSpeed: desiredSpeed,
			});
		}

		if (thrusters?.components.isThrusters) {
			// Use thrusters to apply the minute steering force
			steeringForce
				.set(0, 0, 0)
				.add(separation(entity))
				.add(leaderFollowing(entity))
				.normalize();

			// Apply the steering force to the thrusters
			thrusters.updateComponent("isThrusters", {
				thrusting: steeringForce.lengthSq() > 0,
				direction: {
					x: steeringForce.x,
					y: steeringForce.y,
					z: steeringForce.z,
				},
			});
		}
		if (this.updateCount === 0) {
			if (warpEngines) {
				pubsub.publish.pilot.warpEngines.get({
					shipId: entity.id,
					systemId: warpEngines?.id,
				});
			}
			if (impulseEngines) {
				pubsub.publish.pilot.impulseEngines.get({
					shipId: entity.id,
					systemId: impulseEngines.id,
				});
			}
		}
	}
}

const separationVector = new Vector3();
const otherEntityPosition = new Vector3();
function separation(entity: Entity) {
	separationVector.set(0, 0, 0);
	const position = entity.components.position;
	if (!position) return separationVector;
	positionVec.set(position.x, position.y, position.z);
	const length = entity.components.size?.length;
	if (!length) return separationVector;

	// Convert length to kilometers
	const minSafeDistance = (length * 15) / 1000;

	// Get all of the nearby entities
	entity.components.nearbyObjects?.objects.forEach(
		(distance: number, id: number) => {
			if (distance > minSafeDistance) return;
			const nearbyEntity = entity.ecs?.getEntityById(id);
			if (!nearbyEntity) return;
			const nearbyPosition = nearbyEntity.components.position;
			if (!nearbyPosition) return;
			otherEntityPosition.set(
				nearbyPosition.x,
				nearbyPosition.y,
				nearbyPosition.z,
			);

			positionVec.sub(otherEntityPosition).normalize().divideScalar(distance);
			separationVector.add(otherEntityPosition);
		},
	);

	return separationVector;
}

const leaderFollowingVector = new Vector3();
function leaderFollowing(entity: Entity) {
	return leaderFollowingVector;
}

function getWarpFactorFromDesiredSpeed(
	desiredSpeed: number,
	warp: Zod.infer<typeof isWarpEngines>,
	isInterstellar = false,
) {
	const {
		interstellarCruisingSpeed,
		solarCruisingSpeed,
		minSpeedMultiplier,
		warpFactorCount,
	} = warp;
	const cruisingSpeed = isInterstellar
		? interstellarCruisingSpeed
		: solarCruisingSpeed;

	const minWarp = cruisingSpeed * minSpeedMultiplier;

	// Calculate max warp speed based on the factor and the number of warp factors
	if (desiredSpeed < 1000) return 0;
	if (desiredSpeed > 1000 && desiredSpeed < minWarp) return 1;
	if (desiredSpeed > cruisingSpeed) return warpFactorCount + 1;

	const speedOutput =
		(desiredSpeed * (warpFactorCount - 1)) / (cruisingSpeed - minWarp) + 1;

	return Math.max(1, speedOutput);
}

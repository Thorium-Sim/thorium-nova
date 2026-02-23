import { Vector3, Matrix4 } from "three";
import { type Entity, System } from "@thorium/utils/ecs";
import { KM_TO_LY, lightYearToLightMinute } from "@thorium/utils/unitTypes";
import { pubsub } from "@thorium/.server/init/pubsub";
import { getAutopilotPositionAndRotation } from "@thorium/utils/starmap/autopilotGetCoordinates";
import type { isWarpEngines } from "@thorium/ecs-components/shipSystems";
import { lerp } from "three/src/math/MathUtils.js";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import type z from "zod";

const emptyVector = new Vector3(0, 0, 0);
const scaleVector = new Vector3(1, 1, 1);
const shipMatrix = new Matrix4();
const steeringForce = new Vector3();

export class AutoThrustSystem extends System {
	static flightMode = ["nova"];
	updateCount = 0;
	test(entity: Entity) {
		return !!(
			entity.components.isShip &&
			entity.components.rotation &&
			entity.components.autopilot
		);
	}
	preUpdate() {
		this.updateCount = (this.updateCount + 1) % 15;
	}
	update(entity: Entity, elapsed: number) {
		const { position, rotation, autopilot } = entity.components;
		if (!position || !rotation || !autopilot?.forwardAutopilot) return;

		const impulseEntity = getShipSystem(this.ecs, {
			systemType: "impulseEngines",
			shipId: entity.id,
		});
		const warpEntity = getShipSystem(this.ecs, {
			systemType: "warpEngines",
			shipId: entity.id,
		});
		const thrustersEntity = getShipSystem(this.ecs, {
			systemType: "thrusters",
			shipId: entity.id,
		});

		const warpEngines = warpEntity?.components.isWarpEngines;
		const impulseEngines = impulseEntity?.components.isImpulseEngines;
		const thrusters = thrustersEntity?.components.isThrusters;

		const {
			isInInterstellar,
			positionVec,
			nextDestination,
			desiredDestination,
			rotationQuat,
			desiredRotationQuat,
		} = getAutopilotPositionAndRotation(entity);

		const distanceInKM =
			positionVec.distanceTo(desiredDestination) *
			(isInInterstellar ? 1 / lightYearToLightMinute(KM_TO_LY) : 1);

		const distanceToNextInKM =
			positionVec.distanceTo(nextDestination) *
			(isInInterstellar ? 1 / lightYearToLightMinute(KM_TO_LY) : 1);

		shipMatrix.compose(emptyVector, rotationQuat, scaleVector);

		const rotationDifference =
			(Math.abs(rotationQuat.angleTo(desiredRotationQuat)) / Math.PI) * 180;

		const powerLevels = impulseEntity?.components.power?.powerLevels || [0];
		const maxSafePower = powerLevels[powerLevels.length - 1] || 1;
		const allocatedPower = impulseEntity?.components.power?.powerSources.length || 0;
		const impulseMaxSpeed =
			(impulseEngines?.cruisingSpeed || 1) * (allocatedPower / maxSafePower);

		// There's a heuristic here for which engine to choose to reach a given destination.
		// Basically, if it would take 15 seconds or less to reach the destination at cruising
		// impulse speed, we should use that. Otherwise, we should use warp.
		const TRAVEL_TIME_THRESHOLD_SECONDS = 30;
		/** How close the ship is to the destination before deactivating warp engines */
		const minWarpDistance = impulseMaxSpeed * TRAVEL_TIME_THRESHOLD_SECONDS;
		const isWithinWarpDistance = distanceInKM > minWarpDistance;

		// This will be 1 if the ship is pointing directly at the destination, and 0 if it's pointing directly away
		const correctDirectionCoefficient = (180 - rotationDifference) / 180;

		// We have to be within 0.5 degrees of the destination to be considered in the right direction
		const inCorrectDirection = rotationDifference <= 5;
		if (warpEngines && isWithinWarpDistance) {
			impulseEntity?.updateComponent("isImpulseEngines", { targetSpeed: 0 });
			// Use warp engines
			const warpCruisingSpeed = isInInterstellar
				? warpEngines.interstellarCruisingSpeed
				: warpEngines.solarCruisingSpeed;

			// Warp is so fast, we'll still require a full rotation before activating.
			if (inCorrectDirection) {
				const desiredSpeed = Math.min(
					warpCruisingSpeed,
					Math.max(0, (distanceInKM - minWarpDistance) / 2),
				);

				// If we're within 2 seconds of the next point, then we can consider
				// it safe to jump to the next point
				const distanceToProceedToNextInPath = desiredSpeed * 2;

				if (distanceToNextInKM < distanceToProceedToNextInPath) {
					autopilot.nextCoordinates = autopilot.path.shift()!;
				}

				// Figure out an appropriate warp factor to get us to that speed.
				const currentWarpFactor = getWarpFactorFromDesiredSpeed(
					desiredSpeed,
					warpEngines,
					isInInterstellar,
				);
				warpEntity.updateComponent("isWarpEngines", {
					currentWarpFactor,
				});
			} else {
				warpEntity.updateComponent("isWarpEngines", { currentWarpFactor: 0 });
			}
		} else if (impulseEngines) {
			warpEntity?.updateComponent("isWarpEngines", {
				currentWarpFactor: 0,
				maxVelocity: 0,
			});

			// Decrease the slow-down slope
			const slowDownSlope = distanceInKM < 100 ? 2 : 1;
			let desiredSpeed = Math.min(
				impulseMaxSpeed,
				Math.max(
					0,
					(correctDirectionCoefficient * distanceInKM) / slowDownSlope,
				),
			);

			// Smooth out the speed changes a little bit if we're increasing speed
			const currentTargetSpeed =
				impulseEntity.components.isImpulseEngines?.targetSpeed || 0;
			desiredSpeed =
				desiredSpeed > currentTargetSpeed
					? lerp(currentTargetSpeed, desiredSpeed, 0.05)
					: desiredSpeed;

			// If we're within 5 seconds of the next point, then we can consider
			// it safe to jump to the next point
			const distanceToProceedToNextInPath = desiredSpeed * 5;
			// Arbitrary number that gets roughly close to 5 KM away
			if (distanceToNextInKM < distanceToProceedToNextInPath) {
				autopilot.nextCoordinates = autopilot.path.shift()!;
			}
			impulseEntity.updateComponent("isImpulseEngines", {
				targetSpeed: desiredSpeed,
			});
		}

		if (thrusters) {
			// Use thrusters to apply the minute steering force
			steeringForce
				.set(0, 0, 0)
				.add(separation(entity))
				.add(leaderFollowing(entity))
				.normalize();

			// Apply the steering force to the thrusters
			thrustersEntity.updateComponent("isThrusters", {
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
					systemId: warpEntity?.id,
				});
			}
			if (impulseEngines) {
				pubsub.publish.pilot.impulseEngines.get({
					shipId: entity.id,
					systemId: impulseEntity.id,
				});
			}
		}
	}
}

const separationPosition = new Vector3();
const separationVector = new Vector3();
const otherEntityPosition = new Vector3();
function separation(entity: Entity) {
	separationVector.set(0, 0, 0);
	const position = entity.components.position;
	if (!position) return separationVector;
	separationPosition.set(position.x, position.y, position.z);
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

			separationPosition
				.sub(otherEntityPosition)
				.normalize()
				.divideScalar(distance);
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
	warp: z.infer<typeof isWarpEngines>,
	isInterstellar = false,
) {
	const {
		interstellarCruisingSpeed,
		solarCruisingSpeed,
		minSpeedMultiplier,
		speeds,
	} = warp;
	const cruisingSpeed = isInterstellar
		? interstellarCruisingSpeed
		: solarCruisingSpeed;

	const minWarp = cruisingSpeed * minSpeedMultiplier;

	// The highest warp factor is the destructive speed, so we don't count that one.
	const warpFactorCount = speeds.length - 1;
	// Calculate max warp speed based on the factor and the number of warp factors
	if (desiredSpeed < 1000) return 0;
	if (desiredSpeed > 1000 && desiredSpeed < minWarp) return 1;
	if (desiredSpeed > cruisingSpeed) return warpFactorCount + 1;

	const speedOutput =
		(desiredSpeed * (warpFactorCount - 1)) / (cruisingSpeed - minWarp) + 1;

	return Math.max(1, speedOutput);
}

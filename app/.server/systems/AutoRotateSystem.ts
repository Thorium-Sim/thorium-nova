import { Quaternion, Vector3, Matrix4 } from "three";
import { type Entity, System } from "@thorium/utils/ecs";
import { autopilotGetCoordinates } from "@thorium/utils/starmap/autopilotGetCoordinates";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { KM_TO_LY, lightYearToLightMinute } from "@thorium/utils/unitTypes";

const rotationQuat = new Quaternion();
const desiredRotationQuat = new Quaternion();
const up = new Vector3(0, 1, 0);
const forward = new Vector3();
const toWaypoint = new Vector3();
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);

/*
 * How auto-rotation works:
 * - Bail if there is no destination, if the autopilot is turned off,
 *     if the angle to the destination is 0, or if there is no desired rotation.
 * - Calculate the max angular acceleration and velocity the
 *     thrusters can provide.
 * - Use a PID controller where the error input is the angle to the
 *     destination and the output is the angular acceleration.
 * - Apply the PID output to the current angular velocity value.
 * - Use the Quaternion.rotateToward function with the angular
 *     velocity value
 */

export class AutoRotateSystem extends System {
	static flightMode = ["nova"];
	test(entity: Entity) {
		return !!(
			entity.components.isShip &&
			entity.components.rotation &&
			entity.components.autopilot
		);
	}

	update(entity: Entity, elapsed: number) {
		const { position, rotation, autopilot } = entity.components;

		const thrusters = getShipSystem(this.ecs, {
			systemType: "thrusters",
			shipId: entity.id,
		});
		if (!thrusters?.components?.isThrusters) return;

		if (
			!position ||
			!rotation ||
			!autopilot?.rotationAutopilot ||
			(!autopilot?.desiredCoordinates && !autopilot.desiredRotation)
		) {
			return;
		}

		// Get the current system the ship is in and the autopilot desired system
		const entitySystem = entity.components.position?.parentId
			? this.ecs.getEntityById(entity.components.position.parentId)
			: null;
		const destinationSystem = entity.components.autopilot?.desiredSolarSystemId
			? this.ecs.getEntityById(entity.components.autopilot.desiredSolarSystemId)
			: null;

		const { nextDestination, positionVec, isInInterstellar } =
			autopilotGetCoordinates(entity, entitySystem, destinationSystem);
		desiredRotationQuat.identity();

		if (autopilot.desiredCoordinates) {
			let doneWithPath = false;

			// Use the ship's current speed to determine when to advance to the
			// next waypoint, matching AutoThrustSystem's approach. This prevents
			// chaotic rotation at warp when the ship overshoots closely-spaced
			// intermediate waypoints.
			const currentSpeed =
				entity.components.velocity?.forwardVelocity || 0;
			const distanceToNext = positionVec.distanceTo(nextDestination);
			const distanceToNextInKM =
				distanceToNext *
				(isInInterstellar
					? 1 / lightYearToLightMinute(KM_TO_LY)
					: 1);
			const distanceThreshold = currentSpeed * 2;

			// Check if the ship has passed the waypoint by testing if it's behind
			// the ship's forward direction. This handles high-speed travel (e.g. warp)
			// where the ship can overshoot waypoints between frames.
			rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
			forward.set(0, 0, 1).applyQuaternion(rotationQuat);
			toWaypoint.copy(nextDestination).sub(positionVec);
			const waypointIsBehind =
				distanceToNext > 0.001 && toWaypoint.dot(forward) < 0;

			if (
				distanceToNextInKM < Math.max(1, distanceThreshold) ||
				waypointIsBehind
			) {
				autopilot.nextCoordinates = autopilot.path.shift()!;
				if (!autopilot.nextCoordinates) {
					if (autopilot.desiredRotation) {
						doneWithPath = true;
						desiredRotationQuat.set(
							autopilot.desiredRotation.x,
							autopilot.desiredRotation.y,
							autopilot.desiredRotation.z,
							autopilot.desiredRotation.w,
						);
					}
					// Otherwise, fall through — nextDestination is already set to
					// desiredDestination by autopilotGetCoordinates, so the lookAt
					// will smoothly point the ship toward the final destination.
				} else {
					nextDestination.set(
						autopilot.nextCoordinates.x,
						autopilot.nextCoordinates.y,
						autopilot.nextCoordinates.z,
					);
				}
			}
			if (!doneWithPath) {
				up.set(0, 1, 0);

				matrix
					.lookAt(positionVec, nextDestination, up)
					.multiply(rotationMatrix);
				// Use the thrusters to adjust the rotation of the ship to point towards the desired destination.
				// First, determine the angle to the destination.
				desiredRotationQuat.setFromRotationMatrix(matrix);
			}
		} else if (autopilot.desiredRotation) {
			desiredRotationQuat.set(
				autopilot.desiredRotation.x,
				autopilot.desiredRotation.y,
				autopilot.desiredRotation.z,
				autopilot.desiredRotation.w,
			);
		}

		// Apply the rotation
		rotationQuat.slerp(desiredRotationQuat, elapsed / 1000);
		entity.updateComponent("rotation", {
			x: rotationQuat.x,
			y: rotationQuat.y,
			z: rotationQuat.z,
			w: rotationQuat.w,
		});
	}
}

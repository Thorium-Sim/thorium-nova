import { Quaternion, Vector3, Matrix4 } from "three";
import { type Entity, System } from "@thorium/utils/ecs";
import { autopilotGetCoordinates } from "@thorium/utils/starmap/autopilotGetCoordinates";
import { getShipSystem } from "@thorium/utils/.server/ship/getShipSystem";
import { clearAutopilotState } from "@thorium/utils/.server/ship/clearAutopilotState";
import { KM_TO_LY, lightYearToLightMinute } from "@thorium/utils/unitTypes";
import { pubsub } from "@thorium/.server/init/pubsub";

const rotationQuat = new Quaternion();
const desiredRotationQuat = new Quaternion();
const cachedRollQuat = new Quaternion();
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

		// Lazily cache the ship's current roll (twist around local Z axis)
		// when autopilot first activates, so we can preserve it during heading changes.
		if (!autopilot.cachedRoll) {
			// Twist-swing decomposition: extract the twist (roll) around the forward axis (0,0,1)
			const len = Math.sqrt(
				rotation.z * rotation.z + rotation.w * rotation.w,
			);
			if (len > 1e-8) {
				cachedRollQuat.set(0, 0, rotation.z / len, rotation.w / len);
			} else {
				cachedRollQuat.identity();
			}
			entity.updateComponent("autopilot", {
				cachedRoll: {
					x: cachedRollQuat.x,
					y: cachedRollQuat.y,
					z: cachedRollQuat.z,
					w: cachedRollQuat.w,
				},
			});
		} else {
			cachedRollQuat.set(
				autopilot.cachedRoll.x,
				autopilot.cachedRoll.y,
				autopilot.cachedRoll.z,
				autopilot.cachedRoll.w,
			);
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
				// Check if we're already at the final leg of the journey (no intermediate
				// waypoints left). If nextCoordinates was null and path is empty,
				// autopilotGetCoordinates used desiredDestination as nextDestination.
				const wasAtFinalLeg =
					!autopilot.nextCoordinates && autopilot.path.length === 0;

				autopilot.nextCoordinates = autopilot.path.shift()!;
				if (!autopilot.nextCoordinates) {
					if (
						wasAtFinalLeg &&
						!autopilot.forwardAutopilot &&
						waypointIsBehind
					) {
						// Ship has blown past the final destination while using manual
						// engine controls. Deactivate autopilot and unlock the course,
						// similar to arriving normally via WaypointRemoveSystem.
						const waypointId = autopilot.destinationWaypointId;
						clearAutopilotState(entity);
						if (typeof waypointId === "number") {
							const waypoint = this.ecs.getEntityById(waypointId);
							waypoint?.updateComponent("isWaypoint", { isActive: false });
						}
						pubsub.publish.pilot.autopilot.get({ shipId: entity.id });
						pubsub.publish.waypoints.all({ shipId: entity.id });
						return;
					}
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
				// Compose the cached roll so the ship preserves its roll during heading changes.
				desiredRotationQuat.multiply(cachedRollQuat);
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

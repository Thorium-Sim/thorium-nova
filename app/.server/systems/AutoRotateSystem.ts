import { Quaternion, Vector3, Matrix4 } from "three";
import { type Entity, System } from "@thorium/utils/ecs";
import { autopilotGetCoordinates } from "@thorium/utils/starmap/autopilotGetCoordinates";

const rotationQuat = new Quaternion();
const desiredRotationQuat = new Quaternion();
const up = new Vector3(0, 1, 0);
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);

/*
 * How auto-rotation works:
 * - Bail if there is no destination, if the autopilot is turned off
 *     or if the angle to the destination is 0.
 * - Calculate the max angular acceleration and velocity the
 *     thrusters can provide.
 * - Use a PID controller where the error input is the angle to the
 *     destination and the output is the angular acceleration.
 * - Apply the PID output to the current angular velocity value.
 * - Use the Quaternion.rotateToward function with the angular
 *     velocity value
 */

export class AutoRotateSystem extends System {
	test(entity: Entity) {
		return !!(
			entity.components.isShip &&
			entity.components.rotation &&
			entity.components.autopilot
		);
	}

	update(entity: Entity, elapsed: number) {
		const { position, rotation, autopilot } = entity.components;
		const thrusters = this.ecs.entities.find(
			(sysEntity) =>
				sysEntity.components.isThrusters &&
				entity.components.shipSystems?.shipSystems.has(sysEntity.id),
		);
		if (!thrusters?.components?.isThrusters) return;

		if (
			!position ||
			!rotation ||
			!autopilot?.rotationAutopilot ||
			!autopilot?.desiredCoordinates
		) {
			thrusters.components.isThrusters.autoRotationVelocity = 0;
			return;
		}

		// Get the current system the ship is in and the autopilot desired system
		const entitySystem = entity.components.position?.parentId
			? this.ecs.getEntityById(entity.components.position.parentId)
			: null;
		const destinationSystem = entity.components.autopilot?.desiredSolarSystemId
			? this.ecs.getEntityById(entity.components.autopilot.desiredSolarSystemId)
			: null;

		const { nextDestination, positionVec } = autopilotGetCoordinates(
			entity,
			entitySystem,
			destinationSystem,
		);
		const distance = positionVec.distanceToSquared(nextDestination);

		if (distance < 1) {
			autopilot.nextCoordinates = autopilot.path.shift()!;
			if (!autopilot.nextCoordinates) {
				thrusters.components.isThrusters.autoRotationVelocity = 0;
				return;
			}
		}

		rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
		up.set(0, 1, 0).applyQuaternion(rotationQuat);

		matrix.lookAt(positionVec, nextDestination, up).multiply(rotationMatrix);
		// Use the thrusters to adjust the rotation of the ship to point towards the desired destination.
		// First, determine the angle to the destination.
		desiredRotationQuat.setFromRotationMatrix(matrix);

		// Apply the rotation
		rotationQuat.slerp(desiredRotationQuat, 0.01);
		entity.updateComponent("rotation", {
			x: rotationQuat.x,
			y: rotationQuat.y,
			z: rotationQuat.z,
			w: rotationQuat.w,
		});
	}
}

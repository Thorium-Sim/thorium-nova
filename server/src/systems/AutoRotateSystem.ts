import { Quaternion, Vector3, Matrix4 } from "three";
import { type Entity, System } from "../utils/ecs";
import { autopilotGetCoordinates } from "../utils/autopilotGetCoordinates";
import Controller from "node-pid-controller";

const positionVec = new Vector3();
const rotationQuat = new Quaternion();
const desiredDestination = new Vector3();
const desiredRotationQuat = new Quaternion();
const up = new Vector3(0, 1, 0);
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);

const rotationControllerCache = new Map<number, Controller>();
function getRotationController(id: number) {
	if (!rotationControllerCache.has(id)) {
		const rotationController = new Controller({
			k_p: 0.1,
			k_i: 0,
			k_d: 0.05,
			i_max: 1,
		});
		rotationController.setTarget(1);
		rotationControllerCache.set(id, rotationController);
	}
	return rotationControllerCache.get(id)!;
}
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
		const fps = 1000 / elapsed;
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

		autopilotGetCoordinates(
			entity,
			entitySystem,
			destinationSystem,
			desiredDestination,
			positionVec,
		);
		const distance = positionVec.distanceTo(desiredDestination);
		if (distance < 1) {
			thrusters.components.isThrusters.autoRotationVelocity = 0;
			return;
		}

		rotationQuat.set(rotation.x, rotation.y, rotation.z, rotation.w);
		up.set(0, 1, 0).applyQuaternion(rotationQuat);

		matrix.lookAt(positionVec, desiredDestination, up).multiply(rotationMatrix);
		// Use the thrusters to adjust the rotation of the ship to point towards the desired destination.
		// First, determine the angle to the destination.
		desiredRotationQuat.setFromRotationMatrix(matrix);

		// Figure out the max values for the thrusters
		const rpm = thrusters.components.isThrusters.rotationMaxSpeed * Math.PI * 2;
		const rpf = rpm / 60 / fps;

		const accelMax =
			thrusters.components.isThrusters.rotationThrust /
			(entity.components?.mass?.mass || 70000);
		const angleTo = rotationQuat.angleTo(desiredRotationQuat);
		const rotationController = getRotationController(entity.id);
		const output = rotationController.update(1 - angleTo);
		const acc = Math.min(Math.max(output, accelMax * -1), accelMax);
		thrusters.updateComponent("isThrusters", {
			autoRotationVelocity: Math.min(
				rpf,
				thrusters.components.isThrusters.autoRotationVelocity + acc,
			),
		});

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

import { Matrix4, Quaternion, Vector3 } from "three";
import type { Entity } from "./ecs";

const positionVec = new Vector3();
const desiredDestination = new Vector3();
const rotationQuat = new Quaternion();
const up = new Vector3(0, 1, 0);
const matrix = new Matrix4();
const rotationMatrix = new Matrix4().makeRotationY(-Math.PI);
const desiredRotationQuat = new Quaternion();

export function autopilotGetCoordinates(
	entity: Entity,
	shipSystem: Entity | null,
	autopilotDesiredSystem: Entity | null,
): {
	isInInterstellar: boolean;
	desiredDestination: Vector3;
	positionVec: Vector3;
} {
	const { position, rotation, autopilot } = entity.components;
	if (!position || !rotation || !autopilot?.desiredCoordinates)
		return { isInInterstellar: false, desiredDestination, positionVec };
	if (
		autopilotDesiredSystem?.id === entity.components.position?.parentId ||
		(!autopilotDesiredSystem && !entity.components.position?.parentId)
	) {
		let nextCoordinates = autopilot.nextCoordinates;
		if (!nextCoordinates) nextCoordinates = autopilot.path.shift() || null;
		const coordinates = nextCoordinates || autopilot.desiredCoordinates;
		// Within the system or within interstellar space.
		if (coordinates) {
			desiredDestination.set(coordinates.x, coordinates.y, coordinates.z);
		}
		positionVec.set(position.x, position.y, position.z);
		return {
			isInInterstellar: entity.components.position?.parentId === null,
			desiredDestination,
			positionVec,
		};
	}
	if (!autopilotDesiredSystem) {
		// From within a system to some random point in interstellar space
		if (autopilot.desiredCoordinates) {
			desiredDestination.set(
				autopilot.desiredCoordinates?.x,
				autopilot.desiredCoordinates?.y,
				autopilot.desiredCoordinates?.z,
			);
		}
		if (shipSystem?.components.position) {
			positionVec.set(
				shipSystem.components.position.x,
				shipSystem.components.position.y,
				shipSystem.components.position.z,
			);
		}
		return { isInInterstellar: false, desiredDestination, positionVec };
	}
	// From within one system to within another system
	if (autopilotDesiredSystem.components.position) {
		desiredDestination.set(
			autopilotDesiredSystem.components.position.x,
			autopilotDesiredSystem.components.position.y,
			autopilotDesiredSystem.components.position.z,
		);
	}
	if (shipSystem?.components.position) {
		positionVec.set(
			shipSystem.components.position.x,
			shipSystem.components.position.y,
			shipSystem.components.position.z,
		);
		return { isInInterstellar: false, desiredDestination, positionVec };
	}
	// We are in interstellar space now, going to a system
	positionVec.set(position.x, position.y, position.z);
	return { isInInterstellar: true, desiredDestination, positionVec };
}

export function getAutopilotPositionAndRotation(entity: Entity) {
	const { rotation } = entity.components;

	// Get the current system the ship is in and the autopilot desired system
	const entitySystem = entity.components.position?.parentId
		? entity.ecs!.getEntityById(entity.components.position.parentId)
		: null;
	const destinationSystem = entity.components.autopilot?.desiredSolarSystemId
		? entity.ecs!.getEntityById(
				entity.components.autopilot.desiredSolarSystemId,
		  )
		: null;

	const { isInInterstellar, desiredDestination, positionVec } =
		autopilotGetCoordinates(entity, entitySystem, destinationSystem);
	rotationQuat.set(rotation!.x, rotation!.y, rotation!.z, rotation!.w);

	up.set(0, 1, 0).applyQuaternion(rotationQuat);

	matrix.lookAt(positionVec, desiredDestination, up).multiply(rotationMatrix);
	desiredRotationQuat.setFromRotationMatrix(matrix);

	return {
		isInInterstellar,
		positionVec,
		desiredDestination,
		rotationQuat,
		desiredRotationQuat,
	};
}

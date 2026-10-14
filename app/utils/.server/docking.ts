import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { computeDockedTransform } from "@thorium/utils/dockingClient";
import { Entity } from "@thorium/utils/ecs";
import { getCollider } from "@thorium/utils/physics/initColliders";
import { Quaternion, Vector3 } from "three";

const frameAVec = new Vector3();
const frameBVec = new Vector3();
const frameAQuat = new Quaternion();
const frameBQuat = new Quaternion();
const forward = new Vector3(0, 0, 1);

/** This function assumes the docking ports are already connected as ships are approaching to dock */
export function calculateDockedTransformFromShips(guestShip: Entity, hostShip: Entity) {
	const ecs = guestShip.ecs;
	const guestPort = getShipSystems(ecs, { systemType: "dockingPort", shipId: guestShip.id }).find(
		(s) => true, //s.components.isDockingPort?.state === "outgoing",
	);

	const hostPort = getShipSystems(ecs, { systemType: "dockingPort", shipId: hostShip.id }).find(
		(s) => {
			return true; /*(
				s.components.isDockingPort?.state === "incoming" &&
				s.components.isDockingPort.connectedPortId === guestPort?.id
			);*/
		},
	);
	if (!guestPort || !hostPort) return null;

	const hostCollider = getCollider(hostShip.components.isShip!.assets.model!);
	const guestCollider = getCollider(guestShip.components.isShip!.assets.model!);

	return computeDockedTransform({
		hostPosition: {
			x: hostShip.components.position!.x,
			y: hostShip.components.position!.y,
			z: hostShip.components.position!.z,
		},
		hostRotation: hostShip.components.rotation!,
		hostPortPos: [
			hostPort.components.position!.x,
			hostPort.components.position!.y,
			hostPort.components.position!.z,
		],
		hostPortDir: [
			hostPort.components.isDockingPort!.orientation.x,
			hostPort.components.isDockingPort!.orientation.y,
			hostPort.components.isDockingPort!.orientation.z,
		],
		hostCenterOfMass: hostCollider && [
			hostCollider.centerOfMass[0] / 1000,
			hostCollider.centerOfMass[1] / 1000,
			hostCollider.centerOfMass[2] / 1000,
		],
		guestPortPos: [
			guestPort.components.position!.x,
			guestPort.components.position!.y,
			guestPort.components.position!.z,
		],
		guestPortDir: [
			guestPort.components.isDockingPort!.orientation.x,
			guestPort.components.isDockingPort!.orientation.y,
			guestPort.components.isDockingPort!.orientation.z,
		],
		guestCenterOfMass: guestCollider && [
			guestCollider.centerOfMass[0] / 1000,
			guestCollider.centerOfMass[1] / 1000,
			guestCollider.centerOfMass[2] / 1000,
		],
		currentGuestRotation: guestShip.components.rotation,
	});
}

export function dockEntities(guest: Entity, host: Entity) {
	const ecs = guest.ecs;
	const [hostPort] = getShipSystems(ecs, { systemType: "dockingPort", shipId: host.id });
	const [guestPort] = getShipSystems(ecs, { systemType: "dockingPort", shipId: guest.id });
	if (!hostPort.components.position || !guestPort.components.position)
		throw new Error("Unable to dock — missing position component.");

	const jointEntity = new Entity();

	const hostPosition = hostPort.components.position;
	const guestPosition = guestPort.components.position;
	const hostOrientation = hostPort.components.isDockingPort!.orientation;
	const guestOrientation = guestPort.components.isDockingPort!.orientation;

	const sizeA = host.components.size?.length || 1;
	const sizeB = guest.components.size?.length || 1;

	jointEntity.addComponent("fixedConstraint", {
		idA: host?.id,
		idB: guest?.id,
		anchorA: [hostPosition.x * sizeA, hostPosition.y * sizeA, hostPosition.z * sizeA],
		anchorB: [guestPosition.x * sizeB, guestPosition.y * sizeB, guestPosition.z * sizeB],
		frameA: [hostOrientation.x, hostOrientation.y, hostOrientation.z],
		// Reverse the orientation so we dock the correct way.
		frameB: [-guestOrientation.x, -guestOrientation.y, -guestOrientation.z],
	});
	// ecs.addEntity(jointEntity);

	// // Snap the guest to the calculated docking position
	const transform = calculateDockedTransformFromShips(guest, host);
	if (transform) {
		const { position, rotation } = transform;
		guest.updateComponent("position", {
			x: position.x,
			y: position.y,
			z: position.z,
		});
		guest.updateComponent("rotation", {
			x: rotation.x,
			y: rotation.y,
			z: rotation.z,
			w: rotation.w,
		});
		guest.updateComponent("velocity", {
			x: 0,
			y: 0,
			z: 0,
		});
		guest.updateComponent("rotationVelocity", {
			x: 0,
			y: 0,
			z: 0,
		});
	}

	guest?.addComponent("isDocked", {
		dockingPortId: guestPort.id,
		hostDockingPortId: hostPort.id,
		hostShipId: host!.id,
		jointId: jointEntity.id,
	});
	hostPort.updateComponent("isDockingPort", { connectedPortId: guestPort.id, state: "incoming" });
	guestPort.updateComponent("isDockingPort", { connectedPortId: hostPort.id, state: "clamps" });
}

export function undock(guest: Entity) {
	if (!guest.components.isDocked) return;
	const { dockingPortId, hostDockingPortId, jointId } = guest.components.isDocked;

	const hostDockingPort = guest.ecs.getEntityById(hostDockingPortId);
	const guestDockingPort = guest.ecs.getEntityById(dockingPortId);
	guest.ecs.removeEntityById(jointId || -1);
	guest.removeComponent("isDocked");
	hostDockingPort?.updateComponent("isDockingPort", { connectedPortId: null, state: "idle" });
	guestDockingPort?.updateComponent("isDockingPort", { connectedPortId: null, state: "idle" });
}

import { getShipSystems } from "@thorium/utils/.server/ship/getShipSystem";
import { computeDockedTransform } from "@thorium/utils/dockingClient";
import { Entity } from "@thorium/utils/ecs";
import { Quaternion, Vector3 } from "three";

const anchorA = new Vector3();
const anchorB = new Vector3();
const frameAVec = new Vector3();
const frameBVec = new Vector3();
const frameAQuat = new Quaternion();
const frameBQuat = new Quaternion();
const forward = new Vector3(0, 0, 1);

/** This function assumes the docking ports are already connected as ships are approaching to dock */
export function calculateDockedTransformFromShips(guestShip: Entity, hostShip: Entity) {
	const ecs = guestShip.ecs;
	const guestPort = getShipSystems(ecs, { systemType: "dockingPort", shipId: guestShip.id }).find(
		(s) => s.components.isDockingPort?.state === "outgoing",
	);

	const hostPort = getShipSystems(ecs, { systemType: "dockingPort", shipId: hostShip.id }).find(
		(s) => {
			return (
				s.components.isDockingPort?.state === "incoming" &&
				s.components.isDockingPort.connectedPortId === guestPort?.id
			);
		},
	);
	if (!guestPort || !hostPort) return null;
	anchorA
		.set(
			hostPort.components.position!.x,
			hostPort.components.position!.y,
			hostPort.components.position!.z,
		)
		.divideScalar(1000);
	anchorB
		.set(
			guestPort.components.position!.x,
			guestPort.components.position!.y,
			guestPort.components.position!.z,
		)
		.divideScalar(1000);
	return computeDockedTransform({
		hostPosition: hostShip.components.position!,
		hostRotation: hostShip.components.rotation!,
		hostPortPos: anchorA,
		hostPortDir: frameAVec
			.set(0, 0, 1)
			.applyQuaternion(
				frameAQuat.setFromUnitVectors(forward, hostPort.components.isDockingPort!.orientation),
			)
			.toArray(),
		hostScale: hostShip.components.size!.length,
		guestPortPos: anchorB,
		guestPortDir: frameBVec
			.set(0, 0, 1)
			.applyQuaternion(
				frameBQuat.setFromUnitVectors(forward, guestPort.components.isDockingPort!.orientation),
			)
			.toArray(),
		guestScale: guestShip.components.size!.length,
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
	const frameATuple = frameAQuat
		.setFromUnitVectors(forward, hostPort.components.isDockingPort!.orientation)
		.toArray();
	const frameBTuple = frameBQuat
		.setFromUnitVectors(forward, guestPort.components.isDockingPort!.orientation)
		.toArray();

	const anchorA = {
		x: hostPort.components.position.x / 1000,
		y: hostPort.components.position.y / 1000,
		z: hostPort.components.position.z / 1000,
	};
	const anchorB = {
		x: guestPort.components.position.x / 1000,
		y: guestPort.components.position.y / 1000,
		z: guestPort.components.position.z / 1000,
	};
	const frameA = {
		x: frameATuple[0],
		y: frameATuple[1],
		z: frameATuple[2],
		w: frameATuple[3],
	};
	const frameB = {
		x: frameBTuple[0],
		y: frameBTuple[1],
		z: frameBTuple[2],
		w: frameBTuple[3],
	};
	jointEntity.addComponent("fixedJoint", {
		idA: host?.id,
		idB: guest?.id,
		anchorA,
		anchorB,
		frameA,
		frameB,
	});

	// Snap the guest to the calculated docking position
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
	ecs.addEntity(jointEntity);

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

import { Entity } from "@server/utils/ecs";
import { getShipSystem } from "@server/utils/getShipSystem";
import { Euler, Quaternion, Vector3 } from "three";

const positionVector = new Vector3();
const directionVector = new Vector3();
const rotationQuat = new Quaternion();
const rotationEuler = new Euler();
const launcherQuat = new Quaternion();
export function spawnTorpedo(launcher: Entity) {
	const torpedoInventory = launcher.ecs?.getEntityById(
		launcher.components.isTorpedoLauncher?.torpedoEntity || -1,
	);
	if (!torpedoInventory) throw new Error("Torpedo not found");
	const ship = launcher.ecs?.getEntityById(
		launcher.components.isShipSystem?.shipId || -1,
	);
	if (!ship) throw new Error("Ship not found");
	const targeting = getTargeting(ship);
	const shipPosition = ship.components.position;
	const rotation = ship.components.rotation;
	const { width, length, height } = ship.components.size || {
		width: 0,
		length: 0,
		height: 0,
	};
	const distance = (Math.max(width, length, height) / 2 / 1000) * 1.05;
	if (!shipPosition || !rotation)
		throw new Error("Invalid ship. Missing position or rotation.");

	positionVector.set(shipPosition.x, shipPosition.y, shipPosition.z);
	launcherQuat.setFromEuler(
		rotationEuler.set(
			((launcher.components.isTorpedoLauncher?.pitchDegree || 0) * Math.PI) /
				180,
			((launcher.components.isTorpedoLauncher?.headingDegree || 0) * Math.PI) /
				180,
			0,
			"YXZ",
		),
	);

	rotationQuat
		.set(rotation.x, rotation.y, rotation.z, rotation.w)
		.multiply(launcherQuat);
	directionVector
		.set(0, 0, 1)
		.applyQuaternion(rotationQuat)
		.normalize()
		.multiplyScalar(distance);
	positionVector.add(directionVector);
	const torpedoEntity = new Entity();
	const flags = torpedoInventory.components.isInventory?.flags;
	const speed = flags?.torpedoCasing?.speed || 0;

	torpedoEntity.addComponent("position", {
		...shipPosition,
		x: positionVector.x,
		y: positionVector.y,
		z: positionVector.z,
	});
	directionVector.normalize().multiplyScalar(speed);

	torpedoEntity.addComponent("velocity", {
		x: directionVector.x,
		y: directionVector.y,
		z: directionVector.z,
	});
	torpedoEntity.addComponent("isTorpedo", {
		launcherId: launcher.id,
		targetId: targeting?.components.isTargeting?.target || null,
		yield: flags?.torpedoWarhead?.yield || 0,
		damageType: flags?.torpedoWarhead?.damageType || null,
		color: flags?.torpedoWarhead?.color || "white",
		guidanceMode: flags?.torpedoGuidance?.guidanceMode || "visual",
		speed,
		maxForce: flags?.torpedoCasing?.maxForce || 0,
	});
	torpedoEntity.addComponent("mass", { mass: 1500 });

	return torpedoEntity;
}

function getTargeting(ship: Entity) {
	for (const [id] of ship?.components.shipSystems?.shipSystems || []) {
		const entity = ship.ecs?.getEntityById(id);
		if (entity?.components && "isTargeting" in entity.components) {
			return entity;
		}
	}
	return null;
}

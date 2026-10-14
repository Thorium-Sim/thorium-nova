import type { Entity } from "@thorium/utils/ecs";
import { getCollider } from "@thorium/utils/physics/initColliders";
import {
	getPhysicsWorld,
	OBJECT_LAYER_MOVING,
	OBJECT_LAYER_NOT_MOVING,
	OBJECT_LAYER_PROJECTILE,
} from "@thorium/utils/physics/world";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { degToRad, solarMassToKilograms, terranMassToKilograms } from "@thorium/utils/unitTypes";
import { MotionQuality, MotionType, rigidBody, sphere, type RigidBody } from "crashcat";
import { Euler, Quaternion } from "three";

const euler = new Euler();
const rotation = new Quaternion();

export function getRigidBody(entity: Entity) {
	const type = entity.components.isPlanet
		? "planet"
		: entity.components.isStar
			? "star"
			: entity.components.isShip || entity.components.isStarbase
				? "ship"
				: entity.components.isTorpedo
					? "torpedo"
					: "unknown";
	const solarSystemId =
		entity.components.satellite?.parentId || entity.components.position?.parentId || -1;

	const world = getPhysicsWorld(solarSystemId);
	const handles: Map<number, number> = entity.components.physicsHandles?.handles || new Map();

	let body: RigidBody | null = null;

	if (handles.has(solarSystemId)) {
		const handle = handles.get(solarSystemId)!;
		body = rigidBody.get(world, handle)!;
	}
	if (body) return body;

	switch (type) {
		case "planet": {
			if (!entity.components.satellite || !entity.components.isPlanet) break;
			const position = getOrbitPosition(entity.components.satellite!);
			euler.set(0, 0, degToRad(entity.components.satellite.axialTilt));
			rotation.setFromEuler(euler);

			body = rigidBody.create(world, {
				motionType: MotionType.STATIC,
				shape: sphere.create({ radius: entity.components.isPlanet.radius }),
				objectLayer: OBJECT_LAYER_NOT_MOVING,
				mass: terranMassToKilograms(entity.components.isPlanet.terranMass),
				position: position.toArray(),
				quaternion: rotation.toArray(),
				userData: { entityId: entity.id },
			});

			// TODO: Add rings
		}
		case "star": {
			if (!entity.components.isStar) break;
			const position = getOrbitPosition(entity.components.satellite!);

			body = rigidBody.create(world, {
				motionType: MotionType.STATIC,
				shape: sphere.create({ radius: entity.components.isStar.radius }),
				objectLayer: OBJECT_LAYER_NOT_MOVING,
				mass: solarMassToKilograms(entity.components.isStar.solarMass),
				position: position.toArray(),
				userData: { entityId: entity.id },
			});
		}
		case "ship": {
			if (!entity.components.isShip && !entity.components.isStarbase) break;
			const model =
				entity.components.isShip?.assets.model || entity.components.isStarbase?.assets.model;
			if (!model || !entity.components.position || !entity.components.rotation) break;
			const colliderDesc = getCollider(model);

			if (!colliderDesc) {
				console.warn("Collider not found for", model);
				break;
			}
			const position = entity.components.position;
			const rotation = entity.components.rotation;
			body = rigidBody.create(world, {
				motionType: MotionType.DYNAMIC,
				shape: colliderDesc,
				objectLayer: OBJECT_LAYER_MOVING,
				mass: entity.components.mass?.mass || 700_000_000,
				position: [position.x, position.y, position.z],
				quaternion: [rotation.x, rotation.y, rotation.z, rotation.w],
				userData: { entityId: entity.id },
				motionQuality: MotionQuality.LINEAR_CAST,
			});
		}
		case "torpedo": {
			if (!entity.components.isTorpedo || !entity.components.position) break;
			const position = entity.components.position;

			const torpedoRadius = 0.02;
			const torpedoMass = entity.components.mass?.mass || 1500;

			body = rigidBody.create(world, {
				motionType: MotionType.DYNAMIC,
				shape: sphere.create({ radius: torpedoRadius }),
				objectLayer: OBJECT_LAYER_PROJECTILE,
				mass: torpedoMass,
				position: [position.x, position.y, position.z],
				userData: { entityId: entity.id },
				maxLinearVelocity: entity.components.isTorpedo.speed * 1000, /// km/s to m/s
			});
		}
	}
	if (!body) {
		if (process.env.NODE_ENV !== "production") {
			console.error("Unknown solar system physics entity", entity.components);
		}
		throw new Error("Unknown solar system physics entity");
	}

	handles.set(solarSystemId, body.id);
	entity.updateComponent("physicsHandles", { handles });

	return body;
}

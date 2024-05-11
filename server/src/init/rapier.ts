import RAPIER from "@dimforge/rapier3d-compat";
import { getOrbitPosition } from "@server/utils/getOrbitPosition";
import type { ECS, Entity } from "../utils/ecs";
import { Euler, Quaternion, Vector, Vector3 } from "three";

import {
	type Kilometer,
	degToRad,
	solarMassToKilograms,
	terranMassToKilograms,
} from "@server/utils/unitTypes";
import type { World } from "@dimforge/rapier3d-compat";

/**
 * In 32-bit floating point, precision is lost after 2^24,
 * so we limit the physics world to +/- 2^24 meters.
 */
export const COLLISION_PHYSICS_LIMIT: Kilometer = Math.floor(2 ** 24 / 1000);
export const SECTOR_GRID_SIZE: Kilometer = COLLISION_PHYSICS_LIMIT * 2;
export const SECTOR_GRID_OFFSET: Kilometer = SECTOR_GRID_SIZE / 2;
export async function initRapier() {
	await RAPIER.init();
}
export { RAPIER };

const tempVector = new Vector3();
const worldVector = new Vector3();
/**
 * Given a position vector, return the origin point of the world that contains that point.
 */
export function getWorldPosition(entityPosition: {
	x: number;
	y: number;
	z: number;
}) {
	// World positions snap to the center of grid segments.
	const x = Math.floor(entityPosition.x / SECTOR_GRID_SIZE) * SECTOR_GRID_SIZE;
	const y = Math.floor(entityPosition.y / SECTOR_GRID_SIZE) * SECTOR_GRID_SIZE;
	const z = Math.floor(entityPosition.z / SECTOR_GRID_SIZE) * SECTOR_GRID_SIZE;
	return worldVector.set(x, y, z);
}
/**
 * Given a position vector, return sector number that contains that point.
 */
export function getSectorNumber(entityPosition: {
	x: number;
	y: number;
	z: number;
}) {
	// World positions snap to the center of grid segments.
	const x = Math.floor(entityPosition.x / SECTOR_GRID_SIZE);
	const y = Math.floor(entityPosition.y / SECTOR_GRID_SIZE);
	const z = Math.floor(entityPosition.z / SECTOR_GRID_SIZE);
	return [x, y, z].join(":");
}

export function universeToWorld(objectVector: Vector3, worldVector: Vector3) {
	return objectVector.sub(worldVector);
}

export function worldToUniverse(objectVector: Vector3, worldVector: Vector3) {
	return objectVector.add(worldVector);
}

const euler = new Euler();
const rotation = new Quaternion();

export function generateRigidBody(
	world: World,
	entity: Entity,
	colliderCache: Map<string, RAPIER.ColliderDesc>,
) {
	const type = entity.components.isPlanet
		? "planet"
		: entity.components.isStar
		  ? "star"
		  : entity.components.isShip
			  ? "ship"
			  : entity.components.isTorpedo
				  ? "torpedo"
				  : entity.components.debugSphere
					  ? "debugSphere"
					  : "unknown";

	switch (type) {
		case "planet": {
			if (!entity.components.satellite || !entity.components.isPlanet) break;
			const position = getOrbitPosition(entity.components.satellite!);
			euler.set(0, 0, degToRad(entity.components.satellite.axialTilt));
			rotation.setFromEuler(euler);
			const worldPosition = getWorldPosition(position);
			universeToWorld(position, worldPosition);

			const bodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Fixed)
				.setTranslation(position.x, position.y, position.z)
				.setRotation({
					x: rotation.x,
					y: rotation.y,
					z: rotation.z,
					w: rotation.w,
				});
			const body = world.createRigidBody(bodyDesc);
			body.userData = { entityId: entity.id };
			const colliderDesc = new RAPIER.ColliderDesc(
				new RAPIER.Ball(entity.components.isPlanet.radius),
			).setMass(terranMassToKilograms(entity.components.isPlanet.terranMass));
			world.createCollider(colliderDesc, body);
			// TODO: Add rings
			return body;
		}
		case "star": {
			if (!entity.components.isStar) break;
			const position = getOrbitPosition(entity.components.satellite!);
			const worldPosition = getWorldPosition(position);
			universeToWorld(position, worldPosition);

			const bodyDesc = new RAPIER.RigidBodyDesc(
				RAPIER.RigidBodyType.Fixed,
			).setTranslation(position.x, position.y, position.z);

			const body = world.createRigidBody(bodyDesc);
			body.userData = { entityId: entity.id };
			const colliderDesc = new RAPIER.ColliderDesc(
				new RAPIER.Ball(entity.components.isStar.radius),
			).setMass(solarMassToKilograms(entity.components.isStar.solarMass));
			world.createCollider(colliderDesc, body);

			return body;
		}
		case "ship": {
			if (!entity.components.isShip) break;
			const model = entity.components.isShip.assets.model;
			if (!model) break;
			const colliderDesc = colliderCache.get(model);

			if (!colliderDesc) break;
			tempVector.set(
				entity.components.position?.x || 0,
				entity.components.position?.y || 0,
				entity.components.position?.z || 0,
			);
			const worldPosition = getWorldPosition(tempVector);
			universeToWorld(tempVector, worldPosition);

			const res = generateShipRigidBody(
				colliderDesc,
				world,
				tempVector,
				entity.components.rotation || { x: 0, y: 0, z: 0, w: 0 },
			);
			res.body.userData = { entityId: entity.id };
			if (entity.components.mass?.mass) {
				res.collider.setMass(entity.components.mass.mass * 10);
			}

			res.body.enableCcd(true);

			return res.body;
		}
		case "torpedo": {
			if (!entity.components.isTorpedo) break;

			tempVector.set(
				entity.components.position?.x || 0,
				entity.components.position?.y || 0,
				entity.components.position?.z || 0,
			);
			const worldPosition = getWorldPosition(tempVector);
			universeToWorld(tempVector, worldPosition);

			const torpedoRadius = 0.002;
			const torpedoMass = entity.components.mass?.mass || 1500;

			const bodyDesc = new RAPIER.RigidBodyDesc(
				RAPIER.RigidBodyType.Dynamic,
			).setTranslation(tempVector.x, tempVector.y, tempVector.z);
			const body = world.createRigidBody(bodyDesc);
			body.userData = { entityId: entity.id };
			body.enableCcd(true);

			const colliderDesc = new RAPIER.ColliderDesc(
				new RAPIER.Ball(torpedoRadius),
			).setMass(terranMassToKilograms(torpedoMass));
			world.createCollider(colliderDesc, body);

			return body;
		}
		case "debugSphere":
			break;
		default:
			if (process.env.NODE_ENV !== "production") {
				console.warn("Unknown solar system physics entity", entity.components);
			}
	}
}

function generateShipRigidBody(
	colliderDesc: RAPIER.ColliderDesc,
	world: World,
	position: { x: number; y: number; z: number },
	rotation: { x: number; y: number; z: number; w: number },
) {
	const rigidBodyDesc = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic)
		.setTranslation(position.x, position.y, position.z)
		.setRotation({
			w: rotation.w,
			x: rotation.x,
			y: rotation.y,
			z: rotation.z,
		});
	const rigidBody = world.createRigidBody(rigidBodyDesc);
	const collider = world.createCollider(colliderDesc, rigidBody);

	return { collider, body: rigidBody, world };
}

export function getEntitiesInWorld(
	ecs: ECS,
	position: Vector3,
	parentId: number | null,
) {
	const worldPosition = { ...getWorldPosition(position), parentId };
	// Get all entities within the cube defined by the world position +/- the collision limit.
	let entities: Entity[] = [];
	ecs.componentCache.get("position")?.forEach((entity) => {
		if (entityInWorld(entity, worldPosition)) {
			entities.push(entity);
		}
	});
	ecs.componentCache.get("satellite")?.forEach((entity) => {
		if (entityInWorld(entity, worldPosition)) {
			entities.push(entity);
		}
	});
	entities = entities.filter(
		(a, i, arr) => arr.findIndex((b) => b.id === a.id) === i,
	);
	return entities;
}

export function entityInWorld(
	entity: Entity,
	worldPosition: { x: number; y: number; z: number; parentId: number | null },
) {
	let position: {
		x: number;
		y: number;
		z: number;
		parentId: number | null;
	} | null = null;
	if (
		entity.components.position &&
		entity.components.position.type !== "ship"
	) {
		position = entity.components.position;
	} else if (entity.components.satellite) {
		const orbitPosition = getOrbitPosition(entity.components.satellite);
		position = {
			...orbitPosition,
			parentId: entity.components.satellite.parentId,
		};
	}
	if (!position) return false;
	return (
		position.x > worldPosition.x - COLLISION_PHYSICS_LIMIT &&
		position.x < worldPosition.x + COLLISION_PHYSICS_LIMIT &&
		position.y > worldPosition.y - COLLISION_PHYSICS_LIMIT &&
		position.y < worldPosition.y + COLLISION_PHYSICS_LIMIT &&
		position.z > worldPosition.z - COLLISION_PHYSICS_LIMIT &&
		position.z < worldPosition.z + COLLISION_PHYSICS_LIMIT
	);
}

/** Returns the world that contains this entity */
export function getEntityWorld(ecs: ECS, entity: Entity) {
	const position =
		entity.components.position ||
		(entity.components.satellite && {
			...getOrbitPosition(entity.components.satellite),
			parentId: entity.components.satellite.parentId,
		});
	if (typeof position?.parentId !== "number") return null;
	const entitySector = getSectorNumber(position);
	let world: Entity | null = null;

	ecs.componentCache.get("physicsWorld")?.forEach((worldEntity) => {
		if (world) return;
		let {
			location,
			world: physicsWorld,
			enabled,
		} = worldEntity.components.physicsWorld || {};
		if (!physicsWorld) {
			worldEntity.updateComponent("physicsWorld", {
				world: new RAPIER.World({ x: 0, y: 0, z: 0 }),
			});
			physicsWorld = entity.components.physicsWorld?.world;
		}
		if (!location || !enabled) return;
		const key = getSectorNumber(location);
		if (key === entitySector) world = worldEntity;
	});
	return world as Entity | null;
}

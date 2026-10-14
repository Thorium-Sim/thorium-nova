import {
	addBroadphaseLayer,
	addObjectLayer,
	convexHull,
	createWorld,
	createWorldSettings,
	enableCollision,
	fixedConstraint,
	registerConstraints,
	registerShapes,
	sphere,
	type World,
} from "crashcat";

const worldSettings = createWorldSettings();
worldSettings.gravityEnabled = false;

export const BROADPHASE_LAYER_MOVING = addBroadphaseLayer(worldSettings);
export const BROADPHASE_LAYER_NOT_MOVING = addBroadphaseLayer(worldSettings);

export const OBJECT_LAYER_MOVING = addObjectLayer(worldSettings, BROADPHASE_LAYER_MOVING);
export const OBJECT_LAYER_NOT_MOVING = addObjectLayer(worldSettings, BROADPHASE_LAYER_NOT_MOVING);
export const OBJECT_LAYER_PROJECTILE = addObjectLayer(worldSettings, BROADPHASE_LAYER_MOVING);

enableCollision(worldSettings, OBJECT_LAYER_MOVING, OBJECT_LAYER_NOT_MOVING);
enableCollision(worldSettings, OBJECT_LAYER_MOVING, OBJECT_LAYER_MOVING);
enableCollision(worldSettings, OBJECT_LAYER_PROJECTILE, OBJECT_LAYER_MOVING);

registerShapes([sphere.def, convexHull.def]);
registerConstraints([fixedConstraint.def]);

// Key is the solar system
const WORLD_CACHE = new Map<number, World>();

export function getPhysicsWorld(solarSystemId: number) {
	if (!WORLD_CACHE.has(solarSystemId)) {
		WORLD_CACHE.set(solarSystemId, createWorld(worldSettings));
	}
	return WORLD_CACHE.get(solarSystemId)!;
}

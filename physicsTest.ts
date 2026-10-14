console.log("Starting");
import { MotionQuality, MotionType, rigidBody, sphere, updateWorld } from "crashcat";

import { loadGltf } from "./app/utils/.server/loadGltf";
import { generateColliderDesc } from "./app/utils/physics/generateCollider";
import {
	getPhysicsWorld,
	OBJECT_LAYER_MOVING,
	OBJECT_LAYER_NOT_MOVING,
} from "./app/utils/physics/world";

const speedOfLight = 299792.458 * 1000;
const interstellarSpeed = 599600000000 * 1000;
const world = getPhysicsWorld(1);

const gltf = await loadGltf(
	"http://localhost:3001/plugins/Thorium Default/ships/Astra Frigate/assets/model.glb",
);

const collider = generateColliderDesc(gltf, 350);

const ship = rigidBody.create(world, {
	motionType: MotionType.DYNAMIC,
	shape: collider,
	objectLayer: OBJECT_LAYER_MOVING,
	mass: 700_000_000,
	position: [0, 0, 0],
	quaternion: [0, 0, 0, 1],
	motionQuality: MotionQuality.LINEAR_CAST,
	maxLinearVelocity: Number.POSITIVE_INFINITY,
});

const radius = 6371000;
const planet = rigidBody.create(world, {
	motionType: MotionType.STATIC,
	shape: sphere.create({ radius }),
	mass: 5.972e24,
	objectLayer: OBJECT_LAYER_NOT_MOVING,
	position: [0, 0, radius + 5000000000],
});
const PHYSICS_DT = 1 / 60;

let stepCount = 0;
let done = false;
while (done === false) {
	rigidBody.setLinearVelocity(world, ship, [0, 0, interstellarSpeed]);
	console.log(
		stepCount++,
		Math.hypot(
			planet.position[0] - ship.position[0],
			planet.position[1] - ship.position[1],
			planet.position[2] - ship.position[2],
		) - radius,
	);
	updateWorld(
		world,
		{
			onContactAdded(body1, body2) {
				console.log("Contact!");
				done = true;
			},
			onContactRemoved() {
				console.log("Contact removed");
			},
		},
		PHYSICS_DT,
	);
}

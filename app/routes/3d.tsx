import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { q } from "@thorium/context/AppContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { computeDockedTransform } from "@thorium/utils/dockingClient";
import { generateColliderDesc } from "@thorium/utils/physics/generateCollider";
import { getPhysicsWorld, OBJECT_LAYER_MOVING } from "@thorium/utils/physics/world";
import {
	bitmask,
	constraints,
	ConstraintSpace,
	fixedConstraint,
	MotionQuality,
	MotionType,
	offsetCenterOfMass,
	rigidBody,
	updateWorld,
	type World,
} from "crashcat";
import { debugRenderer } from "crashcat/three";
import { groups } from "d3";
import { useMemo, useRef, useState } from "react";
import { Euler, Object3D, Quaternion, Vector3 } from "three";

const angleQuat = new Quaternion().setFromAxisAngle({ x: 1, y: 0, z: 0 }, -Math.PI / 2);
export default function ThreeD() {
	const options = debugRenderer.createDefaultOptions();
	options.bodies.wireframe = true;
	/* contact points options */
	options.contacts.enabled = true;

	/* contact constraints options */
	options.contactConstraints.enabled = true;

	/* constraints options (hinges, sliders, etc.) */
	options.constraints.enabled = true;
	options.constraints.drawLimits = true;
	options.constraints.size = 2;
	const state = debugRenderer.init(options);
	const world = getPhysicsWorld(1);
	const GROUPS = bitmask.createFlags(["player", "enemy", "dockingGuest", "dockingHost"] as const);

	const [ship] = q.plugin.ship.get.useNetRequest({
		pluginId: "Thorium Default",
		shipId: "Astra Frigate",
	});
	const model1 = useGLTF(ship.assets.model, false);
	const model2 = useGLTF(ship.assets.model, false);
	if (!model1) throw new Error("Model not found");
	const collider = generateColliderDesc(model1, ship.length);

	const pos1 = ship.dockingPorts[0].position;
	const portPos = [pos1.x * ship.length, pos1.y * ship.length, pos1.z * ship.length] as [
		number,
		number,
		number,
	];

	const portOrientation = [
		ship.dockingPorts[0].orientation.x,
		ship.dockingPorts[0].orientation.y,
		ship.dockingPorts[0].orientation.z,
	] as [number, number, number];

	const { position, rotation } = computeDockedTransform({
		hostPosition: { x: 0, y: 0, z: 0 },
		hostCenterOfMass: collider?.centerOfMass,
		hostRotation: { x: 0, y: 0, z: 0, w: 1 },
		hostPortPos: portPos,
		hostPortDir: portOrientation,
		guestCenterOfMass: collider?.centerOfMass,
		guestPortPos: portPos,
		guestPortDir: portOrientation,
		currentGuestRotation: { x: 0, y: 1, z: 0, w: 0 },
	});

	const [body1] = useState(() =>
		rigidBody.create(world, {
			motionType: MotionType.DYNAMIC,
			shape: collider,
			objectLayer: OBJECT_LAYER_MOVING,
			mass: 700_000_000,
			position: [0, 0, 0],
			quaternion: [0, 0, 0, 1],
			motionQuality: MotionQuality.LINEAR_CAST,
		}),
	);

	const portVisiblePosition = new Vector3(...portPos).add(
		new Vector3(...body1.centerOfMassPosition),
	);

	const [body2] = useState(() => {
		const body = rigidBody.create(world, {
			motionType: MotionType.DYNAMIC,
			shape: collider,
			objectLayer: OBJECT_LAYER_MOVING,
			mass: 700_000_000,
			position: [position.x, position.y, position.z],
			quaternion: [rotation.x, rotation.y, rotation.z, rotation.w],
			motionQuality: MotionQuality.LINEAR_CAST,
		});
		return body;
	});
	const port2Pos = new Vector3(...portPos)
		.applyQuaternion(rotation)
		.add(new Vector3(...body2.centerOfMassPosition));

	const body1Ref = useRef<Object3D>(null);
	const body2Ref = useRef<Object3D>(null);

	useAnimationFrame((delta) => {
		let body2Position = Math.hypot(...body2.position);
		updateWorld(
			world,
			{
				onBodyPairValidate(bodyA, bodyB) {
					return false;
				},
			},
			1 / 60,
		);
		let posDiff = Math.abs(body2Position - Math.hypot(...body2.position));
		if (posDiff <= 0.00001) {
			body1.motionType = MotionType.DYNAMIC;
		}
		debugRenderer.update(state, world);
		body1Ref.current?.position.set(...body1.position);
		body1Ref.current?.quaternion.set(...body1.quaternion).multiply(angleQuat);
		body2Ref.current?.position.set(...body2.position);
		body2Ref.current?.quaternion.set(...body2.quaternion).multiply(angleQuat);
	});

	return (
		<div className="absolute inset-0 bg-black">
			<Canvas
				camera={{
					near: 0.1,
					far: 10000,
					position: [700, 0, 0],
				}}
			>
				<ambientLight intensity={1} />
				<directionalLight color="white" position={[2, 3, 5]} />
				<OrbitControls />

				<primitive object={state.object3d} />
				<group ref={body1Ref} scale={ship.length}>
					<primitive object={model1.scene.children[0].clone()} rotation={[0, 0, 0]} />
				</group>
				<group ref={body2Ref} scale={ship.length}>
					<primitive object={model2.scene.children[0].clone()} rotation={[0, 0, 0]} />
				</group>
				<mesh position={portVisiblePosition}>
					<sphereGeometry args={[5]} />
					<meshBasicMaterial color="red" wireframe depthTest={false} depthWrite={false} />
				</mesh>
				<mesh position={port2Pos}>
					<sphereGeometry args={[2.5]} />
					<meshBasicMaterial color={0x00ff00} wireframe depthTest={false} depthWrite={false} />
				</mesh>
			</Canvas>
			<div className="absolute top-0 left-0 z-10">
				<button
					onClick={() => {
						rigidBody.addForce(world, body1, [0, 0, 10 * 700000000 * 1000], true);
					}}
				>
					Add force
				</button>
				<button
					onClick={() => {
						body1.motionType = MotionType.KINEMATIC;
						const constraint = fixedConstraint.create(world, {
							bodyIdA: body1.id,
							bodyIdB: body2.id,
							point1: portPos,
							point2: portPos,

							axisX1: portOrientation,
							axisY1: new Vector3(0, 1, 0)
								.applyQuaternion(new Quaternion(...body1.quaternion))
								.toArray(),
							axisX2: [-portOrientation[0], -portOrientation[1], -portOrientation[2]],
							axisY2: new Vector3(0, 1, 0).applyQuaternion(rotation).toArray(),
							space: ConstraintSpace.LOCAL,
						});

						rigidBody.wake(world, body1);
						rigidBody.wake(world, body2);
					}}
				>
					Add Constraint
				</button>
			</div>
		</div>
	);
}

// function Sprite() {
// 	const spriteMap = useShipSprite(
// 		"http://localhost:3000/plugins/Thorium%20Default/ships/Astra%20Frigate/assets/logo.svg",
// 	);
// 	return (
// 		<sprite position={[1, 1, 0]}>
// 			<spriteMaterial attach="material" map={spriteMap} color={0x888888} sizeAttenuation={false} />
// 		</sprite>
// 	);
// }

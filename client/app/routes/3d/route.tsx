import {
	AsciiRenderer,
	Edges,
	OrbitControls,
	Outlines,
	Stars,
} from "@react-three/drei";
import { Canvas, GroupProps, useFrame, useLoader } from "@react-three/fiber";
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
	type InstancedMesh,
	TextureLoader,
	Vector4,
	Matrix4,
	Vector3,
	Quaternion,
	Color,
	AdditiveBlending,
} from "three";
import blobImage from "./blob.png";
import { randomPointOnSphere } from "@thorium/randomPoint/randomPointInSphere";

export default function ThreeD() {
	return (
		<div className="inset-0 absolute bg-black">
			<Canvas>
				<ambientLight intensity={0.1} />
				<directionalLight color="white" position={[2, 3, 5]} />
				<Emitter rotation={[0, Math.PI / 2, 0]}>
					<Cell lifeInSeconds={1} lifeVariance={0.5}>
						<boxGeometry attach="geometry" args={[0.5, 0.5, 0.5]} />
						<meshStandardMaterial attach="material" color="yellow" />
					</Cell>
				</Emitter>
				<OrbitControls />
				<Stars />
			</Canvas>
		</div>
	);
}

/**
 * A component that emits children based on the specified angular range in 3D space.
 *
 * @param {object} props - The properties for the Emitter component.
 * @param {ReactNode} props.children - The children to be emitted.
 * @param {object} [props.emissionAngleRange] - How the emission angle varies in 3D space both positive and negative.
 * @param {number} [props.emissionAngleRange.azimuthal=0] - The azimuthal angle (longitude) from 0˚ to 180˚.
 * @param {number} [props.emissionAngleRange.polar=0] - The polar angle (latitude) from 0˚ to 90˚.
 * @returns {ReactNode} The emitted children.
 */
function Emitter({
	children,
	emissionAngleRange = { azimuthal: 0, polar: 0 },
	...props
}: {
	children: ReactNode;
	emissionAngleRange?: { azimuthal: number; polar: number };
} & GroupProps) {
	return <group {...props}>{children}</group>;
}

let count = 0;
const instanceMatrix = new Matrix4();
const position = new Vector3();
const quaternion = new Quaternion();
const scale = new Vector3();
const color = new Color();
const forward = new Vector3(0, 0, 1);
function Cell({
	children,
	birthRatePerSecond = 1,
	birthRateVariance = 0,
	initialCount = 0,
	lifeInSeconds = 1,
	lifeVariance = 0,
	speed = 1,
	speedVariance = 0,
}: {
	children: ReactNode;
	birthRatePerSecond?: number;
	birthRateVariance?: number;
	initialCount?: number;
	lifeInSeconds?: number;
	lifeVariance?: number;
	speed?: number;
}) {
	const ref = useRef<InstancedMesh>(null);

	const maxParticles = useMemo(
		() =>
			calculateMaxParticles(
				birthRatePerSecond,
				birthRateVariance,
				initialCount,
				lifeInSeconds,
				lifeVariance,
			),
		[
			birthRatePerSecond,
			initialCount,
			lifeVariance,
			birthRateVariance,
			lifeInSeconds,
		],
	);

	useFrame((state, delta) => {
		if (!ref.current) return;
		const { current: mesh } = ref;
		if (!mesh.userData.instanceProps) {
			mesh.userData.instanceProps = [];
		}

		for (let i = 0; i < maxParticles; i++) {
			mesh.getMatrixAt(i, instanceMatrix);
			instanceMatrix.decompose(position, quaternion, scale);
			if (!mesh.userData.instanceProps[i]) {
				mesh.userData.instanceProps[i] = {};
			}
			const instanceProps = mesh.userData.instanceProps[i];
			count++;
			if (count > 30) {
				count = 0;
			}

			// (Re)Initialize the particle
			if (
				!instanceProps.lifetime ||
				instanceProps.lifetime > instanceProps.lifespan
			) {
				position.set(0, 0, 0);
				quaternion.set(0, 0, 0, 1);
				scale.set(1, 1, 1);
				color.set(1, 1, 1);
				instanceProps.lifetime = 0;
				instanceProps.lifespan =
					lifeInSeconds + (Math.random() - 0.5) * 2 * lifeVariance;
			}
			instanceProps.lifetime = instanceProps.lifetime + delta;

			position.addScaledVector(forward.set(0, 0, 1), speed * delta);

			instanceMatrix.compose(position, quaternion, scale);
			mesh.setMatrixAt(i, instanceMatrix);
		}

		mesh.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh ref={ref} args={[undefined, undefined, maxParticles]}>
			{children}
		</instancedMesh>
	);
}

function calculateMaxParticles(
	birthRatePerSecond: number,
	birthRateVariance: number,
	initialCount: number,
	lifeInSeconds: number,
	lifeVariance: number,
) {
	return (
		(birthRatePerSecond + birthRateVariance) * (lifeInSeconds + lifeVariance) +
		initialCount
	);
}

import {
	AsciiRenderer,
	Edges,
	OrbitControls,
	Outlines,
	Stars,
} from "@react-three/drei";
import {
	Canvas,
	type GroupProps,
	useFrame,
	useLoader,
} from "@react-three/fiber";
import {
	type ReactNode,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import {
	type InstancedMesh,
	TextureLoader,
	Vector4,
	Matrix4,
	Vector3,
	Quaternion,
	Color,
	AdditiveBlending,
	Blending,
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
					<Cell
						initialCount={1}
						lifeInSeconds={1}
						lifeVariance={0.5}
						birthRatePerSecond={2}
						birthRateVariance={1}
						speedVariance={0.9}
					>
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
interface InstanceProps {
	/** How long the particle has been alive */
	lifetime: number;
	/** How long the particle is supposed to live for */
	lifespan: number;
	/** How fast the particle goes */
	speed: number;
}
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
	speedVariance?: number;

	// TODO
	angle?: unknown;
	angleVariance?: unknown;
	spin?: unknown;
	spinVariance?: unknown;
	alignAngleWithVelocity?: boolean;
	colorOverLife?: LinearSpline<Color>;
	opacityOverLife?: LinearSpline<number>;
	scale?: number;
	scaleVariance?: number;
	scaleOverLife?: LinearSpline<number>;
	attachToEmitter?: boolean;
	randomSeed?: number;
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
			mesh.userData.instanceProps = new Map();
			mesh.userData.activeParticles = [];
			mesh.userData.inactiveParticles = [];
			mesh.userData.timeToNextParticle =
				birthRatePerSecond + (Math.random() - 0.5) * 2 * birthRateVariance;
			let i = 0;
			for (i = 0; i < initialCount; i++) {
				mesh.userData.activeParticles.push(i);
			}
			for (; i < maxParticles; i++) {
				mesh.userData.inactiveParticles.push(i);
			}
		}

		mesh.userData.timeToNextParticle -= delta;
		while (mesh.userData.timeToNextParticle <= 0) {
			const difference = Math.abs(mesh.userData.timeToNextParticle);
			if (mesh.userData.inactiveParticles.length > 0) {
				const particleIndex = mesh.userData.inactiveParticles.pop();
				mesh.userData.activeParticles.push(particleIndex);
			}
			const rate =
				birthRatePerSecond + (Math.random() - 0.5) * 2 * birthRateVariance;
			mesh.userData.timeToNextParticle = 1 / rate;
			// We might need to emit two or more particles in a single frame. This makes sure that happens.
			mesh.userData.timeToNextParticle -= difference;
		}
		for (let i = 0; i < maxParticles; i++) {
			mesh.getMatrixAt(i, instanceMatrix);
			instanceMatrix.decompose(position, quaternion, scale);
			// If the particle is dead, skip it
			if (!mesh.userData.activeParticles.includes(i)) {
				scale.setScalar(0);
				instanceMatrix.compose(position, quaternion, scale);
				mesh.setMatrixAt(i, instanceMatrix);
				continue;
			}

			let instanceProps: InstanceProps = mesh.userData.instanceProps.get(i);
			count++;
			if (count > 30) {
				count = 0;
			}

			// Initialize the particle
			if (!instanceProps) {
				position.set(0, 0, 0);
				quaternion.set(0, 0, 0, 1);
				scale.set(1, 1, 1);
				color.set(1, 1, 1);

				instanceProps = {
					lifetime: 0,
					lifespan: lifeInSeconds + (Math.random() - 0.5) * 2 * lifeVariance,
					speed: speed + (Math.random() - 0.5) * 2 * speedVariance,
				};
				mesh.userData.instanceProps.set(i, instanceProps);
			}
			instanceProps.lifetime = instanceProps.lifetime + delta;

			position.addScaledVector(
				forward.set(0, 0, 1),
				instanceProps.speed * delta,
			);

			instanceMatrix.compose(position, quaternion, scale);
			mesh.setMatrixAt(i, instanceMatrix);

			// Deactivate the particle if it's time
			if (instanceProps.lifetime > instanceProps.lifespan) {
				const activeParticleIndex = mesh.userData.activeParticles.indexOf(i);
				mesh.userData.activeParticles.splice(activeParticleIndex, 1);
				mesh.userData.inactiveParticles.push(i);
				mesh.userData.instanceProps.delete(i);
			}
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
	return Math.ceil(
		(birthRatePerSecond + birthRateVariance) * (lifeInSeconds + lifeVariance) +
			initialCount,
	);
}
// https://github.com/simondevyoutube/ThreeJS_Tutorial_ParticleSystems/blob/master/main.js
// MIT Copyright (c) 2020 simondevyoutube
class LinearSpline<T> {
	private points: [number, T][];
	private lerp: (t: number, a: T, b: T) => T;
	constructor(lerp: (t: number, a: T, b: T) => T) {
		this.points = [];
		this.lerp = lerp;
	}

	AddPoint(t: number, d: T) {
		this.points.push([t, d]);
	}

	Get(t: number) {
		let p1 = 0;

		for (let i = 0; i < this.points.length; i++) {
			if (this.points[i][0] >= t) {
				break;
			}
			p1 = i;
		}

		const p2 = Math.min(this.points.length - 1, p1 + 1);

		if (p1 === p2) {
			return this.points[p1][1];
		}

		return this.lerp(
			(t - this.points[p1][0]) / (this.points[p2][0] - this.points[p1][0]),
			this.points[p1][1],
			this.points[p2][1],
		);
	}
}

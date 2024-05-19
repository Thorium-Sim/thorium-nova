import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas, type GroupProps, useFrame } from "@react-three/fiber";
import {
	type ReactNode,
	useMemo,
	useRef,
	createContext,
	useContext,
	useState,
	forwardRef,
	useEffect,
} from "react";
import {
	type InstancedMesh,
	Matrix4,
	Vector3,
	Quaternion,
	Color,
	Group,
	MathUtils,
} from "three";

export default function ThreeD() {
	return (
		<div className="inset-0 absolute bg-black">
			<Canvas>
				<ambientLight intensity={0.1} />
				<directionalLight color="white" position={[2, 3, 5]} />
				<Test />
				<OrbitControls />
				<Stars />
			</Canvas>
		</div>
	);
}

function Test() {
	const ref = useRef<Group>(null);
	useFrame((state) => {
		if (!ref.current) return;
		ref.current.position.y = Math.sin(state.clock.elapsedTime) * 2;
	});
	return (
		<Emitter
			ref={ref}
			rotation={[0, Math.PI / 2, 0]}
			emissionAngleRange={{ latitude: 0, longitude: 0 }}
		>
			<mesh>
				<boxGeometry attach="geometry" args={[0.5, 0.5, 0.5]} />
				<meshBasicMaterial wireframe attach="material" color="white" />
			</mesh>
			<Cell
				initialCount={0}
				lifeInSeconds={1}
				lifeVariance={0.5}
				birthRatePerSecond={20}
				birthRateVariance={10}
				speed={2}
				speedVariance={0.9}
				attachToEmitter
				// angleVariance={{ longitude: 180, latitude: 90 }}
				spin={{ longitude: 0, latitude: 1 }}
				colorOverLife={
					new LinearSpline({
						points: [
							[0, new Color("yellow")],
							[0.9, new Color("red")],
						],
					})
				}
				scaleVariance={0.5}
				scalePercentOverLife={
					new LinearSpline({
						points: [
							[0, 0],
							[0.2, 1],
							[0.9, 1],
							[1, 0],
						],
					})
				}
			>
				<coneGeometry attach="geometry" args={[0.5, 0.75, 3, 1]} />
				<meshBasicMaterial wireframe attach="material" color="white" />
			</Cell>
		</Emitter>
	);
}

interface Angle {
	longitude: number;
	latitude: number;
}
const EmitterContext = createContext<{
	emissionAngleRange: Angle;
	getEmitterPosition: () => Vector3;
}>({
	emissionAngleRange: { longitude: 0, latitude: 0 },
	getEmitterPosition: () => new Vector3(0, 0, 0),
});

const useEmitter = () => {
	return useContext(EmitterContext);
};

/**
 * A component that emits children based on the specified angular range in 3D space.
 *
 * @param {object} props - The properties for the Emitter component.
 * @param {ReactNode} props.children - The children to be emitted.
 * @param {object} [props.emissionAngleRange] - How the emission angle varies in 3D space both positive and negative.
 * @param {number} [props.emissionAngleRange.longitude=0] - The azimuthal angle from 0˚ to 180˚.
 * @param {number} [props.emissionAngleRange.latitude=0] - The polar angle from 0˚ to 90˚.
 * @returns {ReactNode} The emitted children.
 */
const Emitter = forwardRef<
	Group,
	{
		children: ReactNode;
		emissionAngleRange?: Angle;
	} & GroupProps
>(
	(
		{ children, emissionAngleRange = { longitude: 0, latitude: 0 }, ...props },
		forwardedRef,
	) => {
		const innerRef = useRef<Group>(null);
		const ref = mergeRefs([forwardedRef, innerRef]);
		return (
			<group {...props} ref={ref}>
				<EmitterContext.Provider
					value={{
						emissionAngleRange,
						getEmitterPosition: () => innerRef.current?.position!,
					}}
				>
					{children}
				</EmitterContext.Provider>
			</group>
		);
	},
);

Emitter.displayName = "Emitter";

const instanceMatrix = new Matrix4();
const position = new Vector3();
const quaternion = new Quaternion();
const meshScale = new Vector3();
const meshColor = new Color();
const velocity = new Vector3();
const forward = new Vector3(0, 0, 1);
const up = new Vector3(0, 1, 0);
interface InstanceProps {
	/** How long the particle has been alive */
	age: number;
	/** How long the particle is supposed to live for */
	lifespan: number;
	/** How fast the particle goes in each direction */
	velocity: [number, number, number];
	/** How big the particle is */
	scale: number;
	/** The position of the emitter when the particle was created */
	position: [number, number, number];
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
	colorOverLife,
	scale = 1,
	scaleVariance = 0,
	scalePercentOverLife,
	angle = {},
	angleVariance = {},
	attachToEmitter = false,
	rng = Math.random,
}: {
	children: ReactNode;
	birthRatePerSecond?: number;
	birthRateVariance?: number;
	initialCount?: number;
	lifeInSeconds?: number;
	lifeVariance?: number;
	speed?: number;
	speedVariance?: number;
	colorOverLife?: LinearSpline<Color>;
	scale?: number;
	scaleVariance?: number;
	scalePercentOverLife?: LinearSpline<number>;
	angle?: Partial<Angle>;
	angleVariance?: Partial<Angle>;
	spin?: Partial<Angle>;
	spinVariance?: Partial<Angle>;

	attachToEmitter?: boolean;
	// TODO
	alignAngleWithVelocity?: boolean;

	rng?: () => number;
}) {
	const ref = useRef<InstancedMesh>(null);
	const { emissionAngleRange, getEmitterPosition } = useEmitter();

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
		const emitterPosition = getEmitterPosition();

		const { current: mesh } = ref;
		if (!mesh.userData.instanceProps) {
			mesh.userData.instanceProps = new Map();
			mesh.userData.activeParticles = [];
			mesh.userData.inactiveParticles = [];
			mesh.userData.timeToNextParticle =
				1 / (birthRatePerSecond + (rng() - 0.5) * 2 * birthRateVariance);
			for (let i = 0; i < initialCount; i++) {
				mesh.userData.activeParticles.push(i);
			}
			for (let i = initialCount; i < maxParticles; i++) {
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
			const rate = birthRatePerSecond + (rng() - 0.5) * 2 * birthRateVariance;
			mesh.userData.timeToNextParticle = 1 / rate;
			// We might need to emit two or more particles in a single frame. This makes sure that happens.
			mesh.userData.timeToNextParticle -= difference;
		}

		for (let i = 0; i < maxParticles; i++) {
			mesh.getMatrixAt(i, instanceMatrix);
			instanceMatrix.decompose(position, quaternion, meshScale);

			// If the particle is dead, skip it
			if (!mesh.userData.activeParticles.includes(i)) {
				meshScale.setScalar(0);
				instanceMatrix.compose(position, quaternion, meshScale);
				mesh.setMatrixAt(i, instanceMatrix);
				continue;
			}

			let instanceProps: InstanceProps = mesh.userData.instanceProps.get(i);

			// Initialize the particle
			if (!instanceProps) {
				position.set(0, 0, 0);
				quaternion.set(0, 0, 0, 1);
				meshScale.set(1, 1, 1);
				meshColor.set(1, 1, 1);
				const speedValue = speed + (rng() - 0.5) * 2 * speedVariance;

				// Randomize the direction of the particle
				{
					const phi =
						(rng() - 0.5) *
						2 *
						MathUtils.degToRad(emissionAngleRange.longitude);
					const theta =
						(rng() - 0.5) * 2 * MathUtils.degToRad(emissionAngleRange.latitude);
					const x = Math.cos(theta) * Math.sin(phi);
					const y = Math.sin(theta);
					const z = Math.cos(theta) * Math.cos(phi);
					velocity.set(x, y, z).normalize().multiplyScalar(speedValue);
				}
				// Randomize the rotation of the particle
				{
					const latitude =
						(angle.latitude || 0) +
						(rng() - 0.5) * 2 * (angleVariance.latitude || 0);
					const longitude =
						(angle.longitude || 0) +
						(rng() - 0.5) * 2 * (angleVariance.longitude || 0);
					const x = Math.cos(latitude) * Math.cos(longitude);
					const y = Math.cos(latitude) * Math.sin(longitude);
					const z = Math.sin(latitude);
					// Reusing this vector to avoid creating a new one
					forward.set(x, y, z);
					quaternion.setFromUnitVectors(up, forward);
				}
				instanceProps = {
					age: 0,
					lifespan: lifeInSeconds + (rng() - 0.5) * 2 * lifeVariance,
					velocity: velocity.toArray(),
					scale: scale + (rng() - 0.5) * 2 * scaleVariance,
					position: attachToEmitter ? [0, 0, 0] : emitterPosition.toArray(),
				};
				mesh.userData.instanceProps.set(i, instanceProps);
			}
			instanceProps.age = instanceProps.age + delta;
			const instanceLifeRatio = instanceProps.age / instanceProps.lifespan;
			// Scale the particle over its lifetime
			const scalePercent =
				scalePercentOverLife?.getPoint(instanceLifeRatio) ?? 1;
			meshScale.setScalar(instanceProps.scale * scalePercent);

			// Adjust the color
			if (colorOverLife) {
				mesh.setColorAt(i, colorOverLife.getPoint(instanceLifeRatio));
			}

			position
				.set(...instanceProps.position)
				.addScaledVector(forward.set(...instanceProps.velocity), delta);
			instanceProps.position = position.toArray();
			if (!attachToEmitter) {
				position.sub(emitterPosition);
			}

			instanceMatrix.compose(position, quaternion, meshScale);
			mesh.setMatrixAt(i, instanceMatrix);

			// Deactivate the particle if it's time
			if (instanceProps.age > instanceProps.lifespan) {
				const activeParticleIndex = mesh.userData.activeParticles.indexOf(i);
				mesh.userData.activeParticles.splice(activeParticleIndex, 1);
				mesh.userData.inactiveParticles.push(i);
				mesh.userData.instanceProps.delete(i);
			}
		}
		if (colorOverLife && mesh.instanceColor) {
			mesh.instanceColor.needsUpdate = true;
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
const lerpVector = new Vector3();
const lerpColor = new Color();
function defaultLerp<T>(a: T, b: T, t: number) {
	if (typeof a === "number" && typeof b === "number")
		return (a + t * (b - a)) as T;
	if (a instanceof Vector3 && b instanceof Vector3)
		return lerpVector.lerpVectors(a, b, t) as T;
	if (a instanceof Color && b instanceof Color)
		return lerpColor.lerpColors(a, b, t) as T;

	throw new Error("No lerp function provided");
}
class LinearSpline<T> {
	private points: [number, T][];
	private lerp: (a: T, b: T, t: number) => T;
	constructor({
		points,
		lerp,
	}: { points?: [number, T][]; lerp?: (a: T, b: T, t: number) => T }) {
		this.points = points || [];
		this.lerp = lerp!;
		if (!this.lerp) {
			this.lerp = defaultLerp;
		}
	}

	addPoint(t: number, d: T) {
		this.points.push([t, d]);
	}

	getPoint(t: number) {
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
			this.points[p1][1],
			this.points[p2][1],
			(t - this.points[p1][0]) / (this.points[p2][0] - this.points[p1][0]),
		);
	}
}

export function mergeRefs<T = any>(
	refs: Array<
		React.MutableRefObject<T> | React.LegacyRef<T> | undefined | null
	>,
): React.RefCallback<T> {
	return (value) => {
		refs.forEach((ref) => {
			if (typeof ref === "function") {
				ref(value);
			} else if (ref != null) {
				(ref as React.MutableRefObject<T | null>).current = value;
			}
		});
	};
}

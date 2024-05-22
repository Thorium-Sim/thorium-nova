import { OrbitControls, Stars, Stats } from "@react-three/drei";
import {
	Canvas,
	type GroupProps,
	useFrame,
	useLoader,
	type SpriteMaterialProps,
	useThree,
} from "@react-three/fiber";
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
	type Group,
	MathUtils,
	AdditiveBlending,
	Object3D,
	TextureLoader,
	DoubleSide,
	Sprite,
} from "three";
import blob from "./blob.png?url";

const instanceMatrix = new Matrix4();
const meshSpin = new Quaternion();
const velocity = new Vector3();
const forward = new Vector3(0, 0, 1);
const up = new Vector3(0, 1, 0);

interface CellProps {
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
	spin?: Partial<Spin>;
	spinVariance?: Partial<Spin>;
	attachToEmitter?: boolean;
	// TODO
	alignAngleWithVelocity?: boolean;

	rng?: () => number;
}
function useParticles({
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
	spin = {},
	spinVariance = {},
	attachToEmitter = false,
	rng = Math.random,
}: CellProps) {
	const { camera } = useThree();
	const userDataRef = useRef<{
		activeParticles: number[];
		inactiveParticles: number[];
		timeToNextParticle: number;
		instanceProps: Map<number, InstanceProps>;
	} | null>(null);
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
		if (!userDataRef.current) {
			// @ts-ignore
			userDataRef.current = {};
		}
		const userData = userDataRef.current;
		if (!userData) throw new Error("userData is null");
		if (!userData.instanceProps) {
			userData.instanceProps = new Map();
			userData.activeParticles = [];
			userData.inactiveParticles = [];
			userData.timeToNextParticle =
				1 / (birthRatePerSecond + (rng() - 0.5) * 2 * birthRateVariance);
			for (let i = 0; i < initialCount; i++) {
				userData.activeParticles.push(i);
			}
			for (let i = initialCount; i < maxParticles; i++) {
				userData.inactiveParticles.push(i);
			}
		}

		userData.timeToNextParticle -= delta;
		while (userData.timeToNextParticle <= 0) {
			const difference = Math.abs(userData.timeToNextParticle);
			if (userData.inactiveParticles.length > 0) {
				const particleIndex = userData.inactiveParticles.pop();
				userData.activeParticles.push(particleIndex!);
			}
			const rate = birthRatePerSecond + (rng() - 0.5) * 2 * birthRateVariance;
			userData.timeToNextParticle = 1 / rate;
			// We might need to emit two or more particles in a single frame. This makes sure that happens.
			userData.timeToNextParticle -= difference;
		}
	});

	function updateParticle(
		index: number,
		transform: Object3D,
		color: Color,
		delta: number,
	) {
		const userData = userDataRef.current;
		if (!userData) throw new Error("userData is null");

		const emitterPosition = getEmitterPosition();

		// If the particle is dead, skip it
		if (!userData.activeParticles.includes(index)) {
			transform.scale.setScalar(0);
			return transform;
		}
		up.set(0, 1, 0);

		let instanceProps: InstanceProps | undefined =
			userData.instanceProps.get(index);

		// Initialize the particle
		if (!instanceProps) {
			transform.position.set(0, 0, 0);
			transform.quaternion.set(0, 0, 0, 1);
			transform.scale.set(1, 1, 1);
			color.set(1, 1, 1);
			const speedValue = speed + (rng() - 0.5) * 2 * speedVariance;

			// Randomize the direction of the particle
			{
				const phi =
					(rng() - 0.5) * 2 * MathUtils.degToRad(emissionAngleRange.longitude);
				const theta =
					(rng() - 0.5) * 2 * MathUtils.degToRad(emissionAngleRange.latitude);
				const x = Math.cos(theta) * Math.sin(phi);
				const y = Math.sin(theta);
				const z = Math.cos(theta) * Math.cos(phi);
				velocity.set(x, y, z).normalize().multiplyScalar(speedValue);
			}

			// Randomize the rotation of the particle
			{
				const theta =
					MathUtils.degToRad(angle.latitude || 0) +
					(rng() - 0.5) * 2 * MathUtils.degToRad(angleVariance.latitude || 0);
				const phi =
					MathUtils.degToRad(angle.longitude || 0) +
					(rng() - 0.5) * 2 * MathUtils.degToRad(angleVariance.longitude || 0);
				const x = Math.cos(theta) * Math.cos(phi);
				const y = Math.cos(theta) * Math.sin(phi);
				const z = Math.sin(theta);
				// Reusing this vector to avoid creating a new one
				forward.set(x, y, z);
				transform.quaternion.setFromUnitVectors(up, forward);
			}

			// Randomize the spin of the particle
			const spinVal: [number, number, number] = [
				(rng() - 0.5) * 2 * (spinVariance.x || 0) + (spin.x || 0),
				(rng() - 0.5) * 2 * (spinVariance.y || 0) + (spin.x || 0),
				(rng() - 0.5) * 2 * (spinVariance.z || 0) + (spin.x || 0),
			];

			instanceProps = {
				age: 0,
				lifespan: lifeInSeconds + (rng() - 0.5) * 2 * lifeVariance,
				velocity: velocity.toArray(),
				scale: scale + (rng() - 0.5) * 2 * scaleVariance,
				position: attachToEmitter ? [0, 0, 0] : emitterPosition.toArray(),
				spin: spinVal,
			};
			userData.instanceProps.set(index, instanceProps);
		}

		// Update the particle
		instanceProps.age = instanceProps.age + delta;
		const instanceLifeRatio = instanceProps.age / instanceProps.lifespan;
		// Scale the particle over its lifetime
		const scalePercent = scalePercentOverLife?.getPoint(instanceLifeRatio) ?? 1;
		transform.scale.setScalar(instanceProps.scale * scalePercent);

		// Adjust the color
		if (colorOverLife) {
			color.set(colorOverLife.getPoint(instanceLifeRatio));
		}

		transform.position
			.set(...instanceProps.position)
			.addScaledVector(forward.set(...instanceProps.velocity), delta);
		instanceProps.position = transform.position.toArray();
		if (!attachToEmitter) {
			transform.position.sub(emitterPosition);
		}

		// Spin the particle
		forward.set(...instanceProps.spin);
		const magnitude = forward.length();
		if (magnitude > 0) {
			// Half angle
			const thetaOverTwo = (magnitude * delta) / 2.0;
			const sinThetaOverTwo = Math.sin(thetaOverTwo);

			// Normalize omega
			const axis = forward.normalize();

			// Construct the quaternion
			meshSpin
				.set(
					axis.x * sinThetaOverTwo,
					axis.y * sinThetaOverTwo,
					axis.z * sinThetaOverTwo,
					Math.cos(thetaOverTwo),
				)
				.normalize();
			transform.quaternion.multiply(meshSpin);
		}
		transform.rotation.y = Math.atan2(
			camera.position.x - transform.position.x,
			camera.position.z - transform.position.z,
		);

		transform.updateMatrix();

		// Deactivate the particle if it's time
		if (instanceProps.age > instanceProps.lifespan) {
			const activeParticleIndex = userData.activeParticles.indexOf(index);
			userData.activeParticles.splice(activeParticleIndex, 1);
			userData.inactiveParticles.push(index);
			userData.instanceProps.delete(index);
		}
		return transform;
	}

	return { maxParticles, updateParticle };
}

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
	const texture = useLoader(TextureLoader, blob);
	return (
		<>
			<Emitter
				ref={ref}
				position={[-3, 0, 0]}
				rotation={[0, Math.PI / 2, 0]}
				emissionAngleRange={{ latitude: 2, longitude: 2 }}
			>
				<SpriteCell
					map={texture}
					blending={AdditiveBlending}
					initialCount={0}
					lifeInSeconds={3}
					lifeVariance={0.5}
					birthRatePerSecond={20}
					birthRateVariance={10}
					speed={2}
					speedVariance={0.9}
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
				/>
				{/* <MeshCell
					initialCount={0}
					lifeInSeconds={3}
					lifeVariance={0.5}
					birthRatePerSecond={20}
					birthRateVariance={10}
					speed={2}
					speedVariance={0.9}
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
					<icosahedronGeometry attach="geometry" args={[0.5, 0]} />
					<meshBasicMaterial
						attach="material"
						color="white"
						wireframe
						blending={AdditiveBlending}
						depthTest={true}
						depthWrite={false}
						side={DoubleSide}
						transparent
					/>
				</MeshCell> */}
			</Emitter>
		</>
	);
}

interface Angle {
	longitude: number;
	latitude: number;
}
interface Spin {
	x: number;
	y: number;
	z: number;
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

interface InstanceProps {
	/** How long the particle has been alive */
	age: number;
	/** How long the particle is supposed to live for */
	lifespan: number;
	/** How fast the particle goes in each direction */
	velocity: [number, number, number];
	/** How big the particle is */
	scale: number;
	/** The position particle. We need to keep this separate because of attachToEmitter*/
	position: [number, number, number];
	/** The angular velocity (spin) of the particle */
	spin: [number, number, number];
}
const transform = new Object3D();
const color = new Color();
function MeshCell({
	children,
	...cellProps
}: {
	children: ReactNode;
} & CellProps) {
	const ref = useRef<InstancedMesh>(null);

	const { maxParticles, updateParticle } = useParticles(cellProps);
	useFrame((state, delta) => {
		if (!ref.current) return;

		const { current: mesh } = ref;

		for (let i = 0; i < maxParticles; i++) {
			mesh.getMatrixAt(i, instanceMatrix);
			instanceMatrix.decompose(
				transform.position,
				transform.quaternion,
				transform.scale,
			);
			updateParticle(i, transform, color, delta);
			mesh.setColorAt(i, color);
			mesh.setMatrixAt(i, transform.matrix);
		}
		if (mesh.instanceColor) {
			mesh.instanceColor.needsUpdate = true;
		}
		mesh.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh
			ref={ref}
			args={[undefined, undefined, maxParticles]}
			frustumCulled={false}
		>
			{children}
		</instancedMesh>
	);
}

function SpriteCell({
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
	spin = {},
	spinVariance = {},
	attachToEmitter = false,
	rng = Math.random,
	...spriteMaterialProps
}: CellProps & SpriteMaterialProps) {
	const { maxParticles, updateParticle } = useParticles({
		birthRatePerSecond,
		birthRateVariance,
		initialCount,
		lifeInSeconds,
		lifeVariance,
		speed,
		speedVariance,
		colorOverLife,
		scale,
		scaleVariance,
		scalePercentOverLife,
		angle,
		angleVariance,
		spin,
		spinVariance,
		attachToEmitter,
		rng,
	});
	const ref = useRef<Group>(null);
	useFrame((state, delta) => {
		if (!ref.current) return;

		for (let i = 0; i < maxParticles; i++) {
			const child = ref.current.children[i];
			if (!child) continue;
			if ("material" in child) {
				// @ts-ignore
				updateParticle(i, child, child.material.color, delta);
			}
		}
	});

	return (
		<group ref={ref}>
			{Array.from({ length: maxParticles }).map((_, i) => (
				<sprite key={i}>
					<spriteMaterial attach="material" {...spriteMaterialProps} />
				</sprite>
			))}
		</group>
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

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
	type Color,
	MathUtils,
	type Object3D,
	Quaternion,
	Vector3,
} from "three";
import { useEmitter } from "./Emitter";
import type { CellProps } from "./types";

const meshSpin = new Quaternion();
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
	/** The position particle. We need to keep this separate because of attachToEmitter*/
	position: [number, number, number];
	/** The angular velocity (spin) of the particle */
	spin: [number, number, number];
}
export function useParticles({
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
	const { emissionAngleRange, getEmitterPosition, onParticlesExpired } =
		useEmitter();

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
			const thetaOverTwo = (magnitude * delta) / 2;
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
			if (userData.activeParticles.length === 0) {
				onParticlesExpired?.();
			}
		}
		return transform;
	}

	return { maxParticles, updateParticle };
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

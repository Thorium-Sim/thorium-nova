import { useFrame, type SpriteMaterialProps } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { useParticles } from "./useParticles";
import type { CellProps } from "./types";

export function SpriteCell({
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

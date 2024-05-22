import { OrbitControls, Stars, Stats } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useRef } from "react";
import {
	Matrix4,
	Color,
	type Group,
	AdditiveBlending,
	TextureLoader,
	DoubleSide,
} from "three";
import blob from "./blob.png?url";
import { LinearSpline } from "./LinearSpline";
import { Emitter } from "./Emitter";
import { SpriteCell } from "./SpriteCell";
import { MeshCell } from "./MeshCell";

export const instanceMatrix = new Matrix4();

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
				<MeshCell
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
				</MeshCell>
			</Emitter>
		</>
	);
}

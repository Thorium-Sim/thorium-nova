import { OrbitControls, Stars, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useShipSprite } from "@thorium/components/Starmap/StarmapShip";
import { Suspense, useState } from "react";
import { Matrix4 } from "three";

export const instanceMatrix = new Matrix4();

export default function ThreeD() {
	return (
		<div className="inset-0 absolute bg-black">
			<Canvas>
				<ambientLight intensity={0.1} />
				<directionalLight color="white" position={[2, 3, 5]} />
				<OrbitControls />
				<Suspense>
					<Ship />
					<Sprite />
				</Suspense>
			</Canvas>
		</div>
	);
}

function Ship() {
	const model = useGLTF(
		"http://localhost:3000/plugins/Thorium%20Default/ships/Alotech%20Frigate/assets/model.glb?1740849292995",
		false,
	);
	return (
		<primitive
			object={model.scene}
			ref={(node: any) => {
				if (node) {
					console.timeEnd("Model");
				}
			}}
		/>
	);
}

function Sprite() {
	const spriteMap = useShipSprite(
		"http://localhost:3000/plugins/Thorium%20Default/ships/Astra%20Frigate/assets/logo.svg",
	);
	return (
		<sprite position={[1, 1, 0]}>
			<spriteMaterial
				attach="material"
				map={spriteMap}
				color={0x888888}
				sizeAttenuation={false}
			/>
		</sprite>
	);
}

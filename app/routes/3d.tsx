import { OrbitControls, Stars, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import { Matrix4 } from "three";

export const instanceMatrix = new Matrix4();

export default function ThreeD() {
	const [on, setOn] = useState(false);
	return (
		<div className="inset-0 absolute bg-black">
			<Canvas
				onPointerDown={() => {
					console.time("Image");
					console.time("Model");
					setOn(!on);
				}}
			>
				<ambientLight intensity={0.1} />
				<directionalLight color="white" position={[2, 3, 5]} />
				<OrbitControls />
				<Suspense>{on ? <Ship /> : null}</Suspense>
			</Canvas>
			{on ? (
				<img
					className="z-50 absolute top-0 left-0 w-32 h-32"
					onLoad={() => console.timeEnd("Image")}
					alt=""
					src="http://localhost:3000/plugins/Thorium%20Default/ships/Alotech%20Frigate/assets/top.png?1740849292995"
				/>
			) : null}
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

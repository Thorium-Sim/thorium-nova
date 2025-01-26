import { OrbitControls, Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { Matrix4 } from "three";

export const instanceMatrix = new Matrix4();

export default function ThreeD() {
	const [on, setOn] = useState(true);
	return (
		<div className="inset-0 absolute bg-black">
			<Canvas
				onPointerDown={() => {
					setOn(!on);
				}}
			>
				<ambientLight intensity={0.1} />
				<directionalLight color="white" position={[2, 3, 5]} />
				<OrbitControls />
				<Stars />
			</Canvas>
		</div>
	);
}

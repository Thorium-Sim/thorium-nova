import { OrbitControls, Stars, Stats } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useRef, useState } from "react";
import {
	Matrix4,
	Color,
	type Group,
	AdditiveBlending,
	TextureLoader,
	DoubleSide,
} from "three";
import { LinearSpline } from "@client/components/particles/LinearSpline";
import { Emitter } from "@client/components/particles/Emitter";
import { SpriteCell } from "@client/components/particles/SpriteCell";
import { MeshCell } from "@client/components/particles/MeshCell";
import { flushSync } from "react-dom";

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

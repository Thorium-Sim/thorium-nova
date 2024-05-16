import {
	AsciiRenderer,
	Edges,
	OrbitControls,
	Outlines,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

export default function ThreeD() {
	return (
		<div className="inset-0 absolute bg-black">
			<Canvas>
				<ambientLight intensity={0.1} />
				<directionalLight color="red" position={[2, 3, 5]} />
				<mesh scale={[0.5, 0.2, 1]}>
					<icosahedronGeometry args={[1, 1]} />
					<meshBasicMaterial color="black" />
					<Outlines thickness={0.02} color="hotpink" />
					<Edges color="hotpink" threshold={15} />
				</mesh>
				<OrbitControls />
			</Canvas>
		</div>
	);
}

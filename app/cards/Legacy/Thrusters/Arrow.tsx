import type { ElementProps } from "@react-three/fiber";
import { type Mesh, Vector3 } from "three";
import { BufferGeometry } from "three";

const geometry = new BufferGeometry();

const arrowVertices = [
	new Vector3(0, 0, 0.1), //0
	new Vector3(-0.5, -0.5, 0.1), //1
	new Vector3(-0.5, 0.5, 0.1), //2
	new Vector3(-0.5, -0.25, 0.1), //3
	new Vector3(-0.5, 0.25, 0.1), //4
	new Vector3(-1, -0.25, 0.1), //5
	new Vector3(-1, 0.25, 0.1), //6

	new Vector3(0, 0, -0.1), //7
	new Vector3(-0.5, -0.5, -0.1), //8
	new Vector3(-0.5, 0.5, -0.1), //9
	new Vector3(-0.5, -0.25, -0.1), //10
	new Vector3(-0.5, 0.25, -0.1), //11
	new Vector3(-1, -0.25, -0.1), //12
	new Vector3(-1, 0.25, -0.1), //13
];
const arrowFaces = [
	//Top
	arrowVertices[2],
	arrowVertices[1],
	arrowVertices[0],
	arrowVertices[3],
	arrowVertices[4],
	arrowVertices[5],
	arrowVertices[4],
	arrowVertices[6],
	arrowVertices[5],

	//Bottom
	arrowVertices[7],
	arrowVertices[8],
	arrowVertices[9],
	arrowVertices[12],
	arrowVertices[11],
	arrowVertices[10],
	arrowVertices[12],
	arrowVertices[13],
	arrowVertices[11],

	//Back
	arrowVertices[13],
	arrowVertices[5],
	arrowVertices[6],
	arrowVertices[5],
	arrowVertices[13],
	arrowVertices[12],

	//MidRight
	arrowVertices[10],
	arrowVertices[3],
	arrowVertices[5],
	arrowVertices[10],
	arrowVertices[5],
	arrowVertices[12],

	//MidLeft
	arrowVertices[13],
	arrowVertices[6],
	arrowVertices[11],
	arrowVertices[11],
	arrowVertices[6],
	arrowVertices[4],

	//LeftArrowBack
	arrowVertices[9],
	arrowVertices[11],
	arrowVertices[2],
	arrowVertices[11],
	arrowVertices[4],
	arrowVertices[2],

	//RightArrowBack
	arrowVertices[1],
	arrowVertices[3],
	arrowVertices[8],
	arrowVertices[10],
	arrowVertices[8],
	arrowVertices[3],

	//LeftArrowFront
	arrowVertices[7],
	arrowVertices[2],
	arrowVertices[0],
	arrowVertices[7],
	arrowVertices[9],
	arrowVertices[2],

	//RightArrowFront
	arrowVertices[0],
	arrowVertices[1],
	arrowVertices[7],
	arrowVertices[1],
	arrowVertices[8],
	arrowVertices[7],
];

geometry.setFromPoints(arrowFaces);

export function Arrow({ opacity = 0, ...props }: ElementProps<typeof Mesh> & { opacity?: number }) {
	return (
		<mesh {...props} geometry={geometry} scale={0.4}>
			<meshBasicMaterial color={0xffff00} opacity={opacity} transparent />
		</mesh>
	);
}

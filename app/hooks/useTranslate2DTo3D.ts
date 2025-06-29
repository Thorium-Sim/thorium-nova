import { useThree } from "@react-three/fiber";
import { Plane, Raycaster, Vector2, Vector3 } from "three";

const raycaster = new Raycaster();
const pos = new Vector3();
const plane = new Plane(new Vector3(0, 1, 0), 0);
export function useTranslate2DTo3D() {
	const { camera, size } = useThree();
	return (x: number, y: number, planeY = plane) => {
		const mv = new Vector2(
			((x - size.left) / size.width) * 2 - 1,
			-((y - size.top) / size.height) * 2 + 1,
		);

		raycaster.setFromCamera(mv, camera);
		// For some reason, calling `intersectPlane` immediately after `setFromCamera` makes the operation fail
		// But adding a log in between makes it work.
		console.info("");
		raycaster.ray.intersectPlane(planeY, pos);
		return pos;
	};
}

export function useGetObjectsAtScreenPoint() {
	const { scene, raycaster } = useThree();

	return () => {
		return raycaster.intersectObjects(scene.children).map((o) => o.object);
	};
}

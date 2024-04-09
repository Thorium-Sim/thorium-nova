import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Plane, Raycaster, Vector2, Vector3 } from "three";

const raycaster = new Raycaster();
export function useTranslate2DTo3D() {
	const { camera, size } = useThree();
	const planeY = new Plane(new Vector3(0, 1, 0), 0);
	return (x: number, y: number) => {
		const mv = new Vector2(
			((x - size.left) / size.width) * 2 - 1,
			-((y - size.top) / size.height) * 2 + 1,
		);
		raycaster.setFromCamera(mv, camera);
		const pos = new Vector3();
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

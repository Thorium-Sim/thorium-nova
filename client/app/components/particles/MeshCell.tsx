import { useFrame } from "@react-three/fiber";
import { type ReactNode, useRef } from "react";
import { type InstancedMesh, Color, Object3D } from "three";
import { useParticles } from "./useParticles";
import { instanceMatrix } from "../../routes/3d/route";
import type { CellProps } from "./types";

const transform = new Object3D();
const color = new Color();
export function MeshCell({
	children,
	...cellProps
}: {
	children: ReactNode;
} & CellProps) {
	const ref = useRef<InstancedMesh>(null);

	const { maxParticles, updateParticle } = useParticles(cellProps);
	useFrame((state, delta) => {
		if (!ref.current) return;

		const { current: mesh } = ref;

		for (let i = 0; i < maxParticles; i++) {
			mesh.getMatrixAt(i, instanceMatrix);
			instanceMatrix.decompose(
				transform.position,
				transform.quaternion,
				transform.scale,
			);
			updateParticle(i, transform, color, delta);
			mesh.setColorAt(i, color);
			mesh.setMatrixAt(i, transform.matrix);
		}
		if (mesh.instanceColor) {
			mesh.instanceColor.needsUpdate = true;
		}
		mesh.instanceMatrix.needsUpdate = true;
	});
	return (
		<instancedMesh
			ref={ref}
			args={[undefined, undefined, maxParticles]}
			frustumCulled={false}
		>
			{children}
		</instancedMesh>
	);
}

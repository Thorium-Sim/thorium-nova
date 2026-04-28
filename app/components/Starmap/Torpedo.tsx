import { useFrame } from "@react-three/fiber";
import { useShipSprite } from "@thorium/components/Starmap/ShipSprite";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { useMemo, useRef } from "react";
import {
	AdditiveBlending,
	DoubleSide,
	Euler,
	type Group,
	InstancedMesh,
	Matrix4,
	MeshBasicMaterial,
	PlaneGeometry,
	Quaternion,
	Vector3,
} from "three";

import blob from "./Effects/blob.png?url";
import Explosion from "./Effects/Explosion";

export function Torpedo({
	color,
	id,
	isDestroyed,
}: {
	id: number;
	color: string;
	isDestroyed?: {
		explosion: string;
	};
}) {
	const blur = useShipSprite(blob);
	const { interpolate } = useLiveQuery();
	const ref = useRef<Group>(null);

	useFrame(() => {
		const position = interpolate(id);
		if (position && ref.current) {
			ref.current.position.set(position.x, position.y, position.z);
		}
	});
	const scale = 1 / 100;
	return (
		<group ref={ref}>
			{isDestroyed ? (
				<Explosion />
			) : (
				<>
					<Nucleus color={color} />
					<sprite scale={[scale, scale, scale]}>
						<spriteMaterial map={blur} color={color} sizeAttenuation={false} depthWrite={false} />
					</sprite>
				</>
			)}

			{/* TODO May 14, 2024 - Add some kind of cool trail. But it has to be with instanced meshes,
      since we're way past 32 bit numbers */}
		</group>
	);
}

const matrix = new Matrix4();
const position = new Vector3();
const rotation = new Quaternion();
const euler = new Euler();
const scale = new Vector3(1, 1, 1);
const axis = new Vector3(0, 1, 0);
const PLANE_COUNT = 10;
const size = 1;
function Nucleus({ color }: { color: string }) {
	const mesh = useMemo(() => {
		const geometry = new PlaneGeometry(size, size);
		const material = new MeshBasicMaterial({
			color,
			blending: AdditiveBlending,
			transparent: true,
			side: DoubleSide,
		});
		const mesh = new InstancedMesh(geometry, material, PLANE_COUNT);
		for (let i = 0; i < PLANE_COUNT; i++) {
			rotation.setFromEuler(
				euler.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
			);
			matrix.compose(position, rotation, scale);
			mesh.setMatrixAt(i, matrix);
		}
		return mesh;
	}, [color]);

	useFrame(() => {
		for (let i = 0; i < PLANE_COUNT; i++) {
			mesh.getMatrixAt(i, matrix);
			matrix.decompose(position, rotation, scale);
			axis.set(Math.random(), Math.random(), Math.random()).normalize();
			rotation.setFromAxisAngle(axis, Math.random() * Math.PI);
			scale.set(Math.random(), Math.random(), Math.random());
			matrix.compose(position, rotation, scale);
			mesh.setMatrixAt(i, matrix);
		}
		mesh.instanceMatrix.needsUpdate = true;
	});
	return <primitive object={mesh} />;
}

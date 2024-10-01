import { q } from "@client/context/AppContext";
import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLiveQuery } from "@thorium/live-query/client";
import { useMemo, useRef } from "react";
import {
	AdditiveBlending,
	DoubleSide,
	type Group,
	Quaternion,
	Texture,
	Vector3,
} from "three";

const thickness = 1;

const shipVector = new Vector3();
const targetVector = new Vector3();
const offsetVector = new Vector3();
const up = new Vector3(0, 1, 0);
const axis = new Vector3();
const direction = new Vector3();
const quaternion = new Quaternion();

export function FiringPhasers() {
	const [firingPhasers] = q.targeting.phasers.firing.useNetRequest();

	return firingPhasers.map((phaser) => (
		<PhaserDisplay
			key={`${phaser.id}`}
			targetId={phaser.targetId}
			shipId={phaser.shipId}
		/>
	));
}
function PhaserDisplay({
	targetId,
	shipId,
}: { targetId: number; shipId: number }) {
	const planeTexture = useMemo(() => {
		const c = document.createElement("canvas").getContext("2d")!;

		c.canvas.width = 1;
		c.canvas.height = 64;

		const g = c.createLinearGradient(0, 0, c.canvas.width, c.canvas.height);

		g.addColorStop(0, "rgba(0, 0, 0, 0)");
		g.addColorStop(0.35, "rgba(50, 50, 50, 0.25)");
		g.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
		g.addColorStop(0.65, "rgba(50, 50, 50, 0.25)");
		g.addColorStop(1, "rgba(0, 0, 0, 0)");

		c.fillStyle = g;
		c.fillRect(0, 0, c.canvas.width, c.canvas.height);

		const texture = new Texture(c.canvas);
		texture.needsUpdate = true;

		return texture;
	}, []);

	const groupRef = useRef<Group>(null);

	const { interpolate } = useLiveQuery();

	useFrame(() => {
		const ship = interpolate(shipId);
		const target = interpolate(targetId);
		if (!ship || !target) return;
		if (!groupRef.current) return;
		quaternion.set(ship.r.x, ship.r.y, ship.r.z, ship.r.w);
		offsetVector.set(0, -1, 0).applyQuaternion(quaternion);
		shipVector.set(ship.x, ship.y - 0.000001, ship.z).add(offsetVector);

		targetVector.set(target.x, target.y, target.z);
		const distance = targetVector.distanceTo(shipVector);
		groupRef.current.position.copy(
			targetVector.add(shipVector).multiplyScalar(0.5),
		);
		direction.subVectors(targetVector, shipVector).normalize();
		axis.crossVectors(up, direction).normalize();
		const angle = Math.acos(up.dot(direction));

		groupRef.current.quaternion.setFromAxisAngle(axis, angle);
		groupRef.current.rotateOnAxis(new Vector3(0, 0, 1), Math.PI / 2);
		groupRef.current.scale.set(distance, 1, 1);
	});
	return (
		<group ref={groupRef}>
			{Array.from({ length: 20 }).map((_, i) => (
				<mesh
					key={i}
					rotation={[(i * Math.PI) / 20, 0, 0]}
					scale={[1, thickness, 1]}
				>
					<planeGeometry args={[1, 0.1]} />
					<meshBasicMaterial
						blending={AdditiveBlending}
						side={DoubleSide}
						color="orange"
						depthWrite={false}
						map={planeTexture}
					/>
				</mesh>
			))}
		</group>
	);
}

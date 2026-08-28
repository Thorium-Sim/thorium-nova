import { Html } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { forwardQuaternion } from "@thorium/cards/Pilot/constants";
import { PlayerArrow } from "@thorium/cards/Pilot/PlayerArrow";
import { PolarGrid } from "@thorium/components/Starmap/PolarGrid";
import { clientId, q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { setCursor } from "@thorium/utils/setCursor";
import { Suspense, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { OrthographicCamera } from "three";
import { BufferGeometry, type Group, type Mesh, Path, Vector3 } from "three";

interface CommSatellite {
	id: number;
	position: [number, number, number];
	frequency: number;
}

const lerpVector = new Vector3();

export function SatelliteMap({
	className,
	radius,
	frequency,
	shouldRender,
	updateSatelliteText,
	selectedSatellite,
	setSelectedSatellite,
}: {
	className?: string;
	radius: number;
	frequency: number;
	shouldRender: boolean;
	updateSatelliteText: (text: string) => void;
	selectedSatellite: number | null;
	setSelectedSatellite: (id: number | null) => void;
}) {
	const { shipId } = useStation();

	const [longRangeComm] = q.longRangeComm.get.useNetRequest({ shipId });
	const [commSatellites] = q.longRangeComm.commSatellites.useNetRequest();
	const [playerShip] = q.ship.player.useNetRequest({ clientId });
	// Get the updates of the ship's position
	q.pilot.stream.useDataStream({ systemId: null, shipId });

	const range = longRangeComm.maxSatelliteRange;

	return (
		<div className={className}>
			<Canvas
				onContextMenu={(e) => {
					e.preventDefault();
				}}
				gl={{ antialias: true, logarithmicDepthBuffer: true, alpha: true }}
				orthographic
				camera={{
					position: [0, range * 2, 0],
					left: -range,
					right: range,
					top: range,
					bottom: -range,
					far: range * 2,
					near: 0.01,
				}}
				frameloop={shouldRender ? "always" : "demand"}
				className="overflow-hidden rounded-full"
			>
				<SatelliteView
					gainRadius={radius}
					range={range}
					commSatellites={commSatellites}
					frequency={frequency}
					shipId={shipId}
					systemPosition={playerShip.systemPosition}
					updateSatelliteText={updateSatelliteText}
					selectedSatellite={selectedSatellite}
					setSelectedSatellite={setSelectedSatellite}
				/>
			</Canvas>
		</div>
	);
}

function SatelliteView({
	gainRadius,
	range,
	commSatellites,
	frequency,
	shipId,
	systemPosition,
	updateSatelliteText,
	selectedSatellite,
	setSelectedSatellite,
}: {
	gainRadius: number;
	range: number;
	commSatellites: CommSatellite[];
	frequency: number;
	shipId: number;
	systemPosition: { x: number; y: number; z: number } | null;
	updateSatelliteText: (text: string) => void;
	selectedSatellite: number | null;
	setSelectedSatellite: (id: number | null) => void;
}) {
	const fixedRef = useRef<Group>(null);
	const relativeRef = useRef<Group>(null);
	const { interpolate } = useLiveQuery();
	const LIGHT_YEAR_TO_LIGHT_MINUTE = 60 * 24 * 365.25;
	const [playerPosition] = useState(new Vector3());
	const [meshes] = useState(new Map());

	const gainRadiusRef = useRef<Mesh>(null);
	const pulseProgress = useRef(0);
	useFrame((props, delta) => {
		pulseProgress.current = (pulseProgress.current + (delta * 2) / Math.max(gainRadius, 1)) % 1;
		const sineProgress = Math.sin(pulseProgress.current * Math.PI);
		gainRadiusRef.current?.scale.setScalar(gainRadius * (sineProgress > 0 ? sineProgress : 0));
		const gainRadiusMaterial = gainRadiusRef.current?.material;
		if (gainRadiusMaterial && !Array.isArray(gainRadiusMaterial)) {
			gainRadiusMaterial.opacity = 0.2 * Math.sin(pulseProgress.current * Math.PI + Math.PI / 2);
		}
	});

	useFrame((props) => {
		if (!fixedRef.current) return;
		const playerShip = interpolate(shipId);
		if (!playerShip) return;

		const { x, y, z, r } = playerShip;
		fixedRef.current.position.set(0, 0, 0);
		fixedRef.current.quaternion.set(r.x, r.y, r.z, r.w).multiply(forwardQuaternion);

		const camera = props.camera as OrthographicCamera;
		camera.position.set(0, range, 0).applyQuaternion(fixedRef.current.quaternion);

		camera.quaternion.set(r.x, r.y, r.z, r.w);
		camera.rotateX(-Math.PI / 2);
		camera.rotateZ(Math.PI);
		if (systemPosition) {
			playerPosition
				.set(systemPosition.x, systemPosition.y, systemPosition.z)
				.multiplyScalar(1 / LIGHT_YEAR_TO_LIGHT_MINUTE);
		} else {
			playerPosition.set(x, y, z).multiplyScalar(1 / LIGHT_YEAR_TO_LIGHT_MINUTE);
		}
		relativeRef.current?.position.copy(playerPosition).negate();

		let inRangeSatellites = 0;
		for (const { id, position, frequency: satelliteFrequency } of commSatellites) {
			const shipDistance = Math.hypot(
				playerPosition.x - position[0],
				playerPosition.y - position[1],
				playerPosition.z - position[2],
			);
			const inRange = shipDistance <= gainRadius;
			if (inRange && id !== shipId) inRangeSatellites++;
			const frequencyDistance = Math.abs(satelliteFrequency - frequency) / 10;
			const scale = Math.min(0.5, Math.max((1 - frequencyDistance) * (inRange ? 1 : 0), 0));

			if ((!inRange || frequencyDistance > 0.75) && selectedSatellite === id) {
				setSelectedSatellite(null);
			}
			lerpVector.setScalar(scale);
			const mesh = meshes.get(id);
			mesh?.scale.lerp(lerpVector, 0.1);
		}
		if (inRangeSatellites === 0) {
			updateSatelliteText("Scanning For Satellites...");
		} else {
			updateSatelliteText(
				`${inRangeSatellites} Satellite${inRangeSatellites === 1 ? "" : "s"} Found`,
			);
		}
	});

	const circleGeometry = useMemo(() => {
		const path = new Path();
		path.absarc(0, 0, 1, 0, Math.PI * 2, false);
		const points = path.getPoints(120);
		return new BufferGeometry().setFromPoints(points);
	}, []);
	return (
		<Suspense fallback={null}>
			<group ref={fixedRef}>
				<group scale={[0.5, 0.5, 0.5]}>
					<PlayerArrow />
				</group>

				<mesh scale={0} ref={gainRadiusRef}>
					<sphereGeometry />
					<meshBasicMaterial transparent opacity={0.2} color={0x2288ff} depthWrite={false} />
				</mesh>

				<lineLoop geometry={circleGeometry} rotation={[Math.PI / 2, 0, 0]} scale={gainRadius}>
					<lineBasicMaterial color={0x2288ff} transparent opacity={0.8} />
				</lineLoop>
				<PolarGrid
					rotation={[0, (2 * Math.PI) / 12, 0]}
					args={[range, 12, range, 64, 0xffffff, 0xffffff]}
				/>
			</group>
			<group ref={relativeRef}>
				{commSatellites.map((c) => (
					<SatelliteDot
						key={c.id}
						{...c}
						ref={(ref) => {
							if (!ref) return;
							meshes.set(ref.id, ref.mesh);
						}}
						selected={c.id === selectedSatellite}
						onClick={() => setSelectedSatellite(c.id)}
					/>
				))}
			</group>
		</Suspense>
	);
}

function SatelliteDot({
	id,
	position,
	ref,
	selected,
	onClick,
}: CommSatellite & {
	ref: (params: { id: number; mesh: Mesh }) => void;
	selected: boolean;
	onClick: () => void;
}) {
	const meshRef = useRef<Mesh>(null);

	useImperativeHandle(ref, () => {
		return { id, mesh: meshRef.current! };
	});
	return (
		<>
			<Html
				position={position}
				className={`satellite-entity entity-${id} pointer-events-none h-4 w-4 -translate-1/2`}
			></Html>
			<mesh
				position={position}
				ref={meshRef}
				scale={[0, 0, 0]}
				onClick={onClick}
				onPointerOver={() => {
					setCursor("pointer");
				}}
				onPointerOut={() => {
					setCursor("auto");
				}}
			>
				<sphereGeometry args={[0.5]} />
				<meshBasicMaterial color={selected ? 0xff8800 : 0xffffff} depthWrite={false} />
			</mesh>
		</>
	);
}

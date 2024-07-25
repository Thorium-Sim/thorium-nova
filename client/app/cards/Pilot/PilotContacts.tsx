import { Edges, Line, Outlines, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useGetStarmapStore } from "@client/components/Starmap/starmapStore";
import { useRef, Suspense, memo, useMemo, Fragment } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { isPlanet, isStar } from "@server/components/list";
import type { satellite } from "@server/components/satellite";
import { getOrbitPosition } from "@server/utils/getOrbitPosition";
import { degToRad, solarRadiusToKilometers } from "@server/utils/unitTypes";
import {
	type BufferAttribute,
	DoubleSide,
	type Group,
	type Mesh,
	MeshBasicMaterial,
	type Object3D,
	type OrthographicCamera,
	Plane,
	Quaternion,
	RingGeometry,
	type Sprite,
	Vector3,
} from "three";
import type { Line2 } from "three-stdlib";
import { useGetFacingWaypoint, useCircleGridStore } from "./useCircleGridStore";
import { WaypointEntity } from "./Waypoint";
import { useLiveQuery } from "@thorium/live-query/client/liveQueryContext";
import { q } from "@client/context/AppContext";
import { setCursor } from "@client/utils/setCursor";
import ReticleTexture from "@client/cards/Pilot/reticle.svg";
import Explosion from "@client/components/Starmap/Effects/Explosion";

export function CircleGridContacts({
	onContactClick,
}: { onContactClick?: (id: number) => void }) {
	const store = useCircleGridStore();
	const tilted = store((store) => store.tilt > 0);
	const useStarmapStore = useGetStarmapStore();
	const systemId = useStarmapStore((store) => store.currentSystem);
	const [orbs] = q.starmapCore.entities.useNetRequest({
		systemId,
	});
	const [ships] = q.starmapCore.ships.useNetRequest({ systemId });
	const [torpedos] = q.starmapCore.torpedos.useNetRequest({ systemId });
	const [targetedContact] = q.targeting.targetedContact.useNetRequest();
	return (
		<group>
			{orbs.map((entity) => {
				const { satellite, isPlanet, isStar } = entity.components;
				if (!satellite) return null;
				return (
					<PlanetaryEntity
						key={entity.id}
						satellite={satellite}
						isPlanet={isPlanet}
						isStar={isStar}
					/>
				);
			})}
			{ships.map(({ id, modelUrl, logoUrl, size }) => {
				if (!modelUrl || !logoUrl) return null;
				return (
					<Suspense key={id} fallback={null}>
						<ErrorBoundary FallbackComponent={fallback} onError={onError}>
							<ShipEntity
								id={id}
								modelUrl={modelUrl}
								logoUrl={logoUrl}
								size={size}
								tilted={tilted}
								onClick={onContactClick}
								targeted={targetedContact?.id === id}
							/>
						</ErrorBoundary>
					</Suspense>
				);
			})}
			{torpedos.map(({ id, color, isDestroyed }) => {
				return (
					<Suspense key={id} fallback={null}>
						<TorpedoEntity
							id={id}
							color={color}
							tilted={tilted}
							isDestroyed={isDestroyed}
						/>
					</Suspense>
				);
			})}
		</group>
	);
}
export function CircleGridWaypoints() {
	const [waypoints] = q.waypoints.all.useNetRequest({ systemId: "all" });
	useGetFacingWaypoint();
	return (
		<group>
			{waypoints.map((waypoint) => (
				<WaypointEntity key={waypoint.id} waypoint={waypoint} />
			))}
		</group>
	);
}

const onError = (err: Error) => console.error(err);
const fallback = () => <Fragment />;
const zeroVector = new Vector3();
const upVector = new Vector3(0, 1, 0);
const playerQuaternion = new Quaternion();
const plane = new Plane();
export const ShipEntity = ({
	id,
	modelUrl,
	logoUrl,
	size,
	tilted,
	onClick,
	targeted,
}: {
	id: number;
	modelUrl: string;
	logoUrl: string;
	size: number;
	tilted?: boolean;
	onClick?: (id: number) => void;
	targeted?: boolean;
}) => {
	const [{ id: playerId }] = q.ship.player.useNetRequest();
	// TODO: Use useGLTF.preload outside of this to preload the asset
	const model = useGLTF(modelUrl || "", false);

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	const scene = useMemo(() => {
		const scene: Object3D = model.scene.clone(true);
		if (scene.traverse) {
			scene.traverse((object: Object3D | Mesh) => {
				if ("material" in object) {
					object.material = new MeshBasicMaterial({
						color: "white",
						wireframe: true,
					});
				}
			});
		}

		return scene;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [modelUrl]);

	const { interpolate } = useLiveQuery();

	const spriteMap = useTexture(logoUrl);
	const reticleMap = useTexture(ReticleTexture);

	const scale = 1 / 50;
	const mesh = useRef<Mesh>(null);
	const line = useRef<Line2>(null);
	const sprite = useRef<Sprite>(null);
	const reticle = useRef<Sprite>(null);
	const shipRef = useRef<Group>(null);
	useFrame((props) => {
		const camera = props.camera as OrthographicCamera;
		const dx = (camera.right - camera.left) / (2 * camera.zoom);
		const ship = interpolate(id);
		const playerShip = interpolate(playerId);

		const playerPosition = playerShip || zeroVector;
		if (!ship || !playerPosition || !playerShip) return;
		if (shipRef.current) {
			if (size && dx / (size / 1000) < 50) {
				if (sprite.current) {
					sprite.current.visible = false;
				}
				shipRef.current.visible = true;
			} else {
				if (sprite.current) {
					sprite.current.visible = true;
				}
				shipRef.current.visible = false;
			}
		}
		if (ship) {
			// Since the sensor grid needs to be oriented at 0,0,0
			// to properly tilt, we reposition the contacts relative
			// to the player ship's position.
			sprite.current?.position.set(
				ship.x - playerPosition.x,
				ship.y - playerPosition.y,
				ship.z - playerPosition.z,
			);
			reticle.current?.position.set(
				ship.x - playerPosition.x,
				ship.y - playerPosition.y,
				ship.z - playerPosition.z,
			);
			if (sprite.current?.position) {
				shipRef.current?.position.copy(sprite.current?.position);
			}
			shipRef.current?.scale.setScalar(size / 1000 || 0.5);
			if (ship.r) {
				shipRef.current?.quaternion.set(ship.r.x, ship.r.y, ship.r.z, ship.r.w);
			}

			// Draw the vertical line from the sensor plane to the ship
			if (playerShip.r && sprite.current?.position && mesh.current?.position) {
				const planeVector = upVector
					.clone()
					.applyQuaternion(
						playerQuaternion.set(
							playerShip.r.x,
							playerShip.r.y,
							playerShip.r.z,
							playerShip.r.w,
						),
					);
				plane.set(planeVector, 0);
				plane.projectPoint(sprite.current.position, mesh.current.position);
				const positions = [
					...sprite.current.position.toArray(),
					...mesh.current.position.toArray(),
				];
				line.current?.geometry.setPositions(positions);
				if (mesh.current && line.current)
					if (tilted) {
						mesh.current.visible = true;
						line.current.visible = true;
					} else {
						mesh.current.visible = false;
						line.current.visible = false;
					}
			}
		}
		sprite.current?.scale.setScalar(dx * 3 * scale);
		reticle.current?.scale.setScalar(dx * 4 * scale);

		mesh.current?.scale.setScalar(dx * 3);
		if (playerShip.r) {
			mesh.current?.quaternion.set(
				playerShip.r.x,
				playerShip.r.y,
				playerShip.r.z,
				playerShip.r.w,
			);
			mesh.current?.rotateX(Math.PI / 2);
		}
	});

	return (
		<Fragment>
			<group ref={shipRef}>
				<primitive object={scene} rotation={[Math.PI / 2, Math.PI, 0]} />
			</group>
			{id !== playerId && (
				<Fragment>
					<sprite
						ref={sprite}
						onPointerDown={() => onClick?.(id)}
						onPointerOver={(e) => {
							if (onClick) {
								setCursor("pointer");
							}
						}}
						onPointerOut={(e) => {
							setCursor("auto");
						}}
					>
						<spriteMaterial
							attach="material"
							map={spriteMap}
							color={"white"}
							sizeAttenuation={true}
						/>
					</sprite>
					<sprite ref={reticle} visible={targeted}>
						<spriteMaterial
							depthTest={false}
							attach="material"
							map={reticleMap}
							color={"red"}
							sizeAttenuation={true}
						/>
					</sprite>
					<Line
						ref={line}
						points={[
							[0, 0, 0],
							[0, 0, 0],
						]}
						color={"white"}
						lineWidth={1}
					/>
					<mesh ref={mesh}>
						<planeGeometry args={[0.01, 0.01]} attach="geometry" />
						<meshBasicMaterial
							attach="material"
							color="white"
							side={DoubleSide}
						/>
					</mesh>
				</Fragment>
			)}
		</Fragment>
	);
};
interface PlanetaryEntityProps {
	satellite: Zod.infer<typeof satellite>;
	isPlanet?: Zod.infer<typeof isPlanet>;
	isStar?: Zod.infer<typeof isStar>;
}

export const PlanetaryEntity = memo(
	({ satellite, isPlanet, isStar }: PlanetaryEntityProps) => {
		const [{ id: playerId }] = q.ship.player.useNetRequest();
		const { interpolate } = useLiveQuery();

		const ref = useRef<Group>(null);
		useFrame(() => {
			const playerShip = interpolate(playerId);
			if (!playerShip || (!isPlanet && !isStar) || !satellite) return;
			const position = getOrbitPosition({
				semiMajorAxis: satellite.semiMajorAxis,
				eccentricity: satellite.eccentricity,
				orbitalArc: satellite.orbitalArc,
				inclination: satellite.inclination,
			});
			ref.current?.position.set(
				position.x - playerShip.x,
				position.y - playerShip.y,
				position.z - playerShip.z,
			);
		});
		if ((!isPlanet && !isStar) || !satellite) return null;

		const size = isPlanet
			? isPlanet.radius
			: isStar
			  ? solarRadiusToKilometers(isStar.radius)
			  : 0;

		return (
			<group
				ref={ref}
				scale={[size, size, size]}
				rotation={[0, 0, degToRad(satellite.axialTilt)]}
			>
				<mesh>
					<icosahedronGeometry args={[1, 3]} attach="geometry" />
					<meshBasicMaterial wireframe color="white" attach="material" />
				</mesh>
				{isPlanet?.ringMapAsset && <BasicRings />}
			</group>
		);
	},
);
PlanetaryEntity.displayName = "PlanetaryEntity";
function BasicRings() {
	const geo = useMemo(() => {
		const geometry = new RingGeometry(1.5, 3, 64);
		const pos = geometry.attributes.position as BufferAttribute;
		const v3 = new Vector3();
		for (let i = 0; i < pos.count; i++) {
			v3.fromBufferAttribute(pos, i);
			if ("setXY" in geometry.attributes.uv) {
				geometry.attributes.uv.setXY(i, v3.length() < 2 ? 0 : 1, 1);
			}
		}
		return geometry;
	}, []);
	return (
		<mesh
			rotation={[Math.PI / 2, 0, 0]}
			scale={[0.7, 0.7, 0.7]}
			geometry={geo}
			receiveShadow
		>
			<meshBasicMaterial
				color={16777215}
				side={DoubleSide}
				wireframe
				transparent
				opacity={0.8}
				attach="material"
			/>
		</mesh>
	);
}

export function TorpedoEntity({
	id,
	tilted,
	color,
	isDestroyed,
}: {
	id: number;
	tilted?: boolean;
	color: string;
	isDestroyed?: {
		explosion: string;
	};
}) {
	const { interpolate } = useLiveQuery();
	const ref = useRef<Mesh>(null);
	const explosionRef = useRef<Group>(null);
	const mesh = useRef<Mesh>(null);
	const line = useRef<Line2>(null);
	const [{ id: playerId }] = q.ship.player.useNetRequest();

	useFrame((props) => {
		const camera = props.camera as OrthographicCamera;
		const dx = (camera.right - camera.left) / (2 * camera.zoom);
		ref.current?.scale.set(0.5, 0.2, 1).multiplyScalar(dx * 0.02);

		const torpedo = interpolate(id);
		const playerShip = interpolate(playerId);
		const isDestroyed = torpedo?.f === 1;
		const playerPosition = playerShip || zeroVector;
		if (!torpedo || !playerPosition || !playerShip) return;

		if (torpedo) {
			// Since the sensor grid needs to be oriented at 0,0,0
			// to properly tilt, we reposition the contacts relative
			// to the player ship's position.
			ref.current?.position.set(
				torpedo.x - playerPosition.x,
				torpedo.y - playerPosition.y,
				torpedo.z - playerPosition.z,
			);
			if (torpedo.r) {
				ref.current?.quaternion.set(
					torpedo.r.x,
					torpedo.r.y,
					torpedo.r.z,
					torpedo.r.w,
				);
			}
			if (
				explosionRef.current &&
				isDestroyed &&
				explosionRef.current.position.lengthSq() === 0 &&
				ref.current?.position
			) {
				explosionRef.current.position.copy(ref.current.position);
			}
			if (ref.current) {
				if (isDestroyed) {
					ref.current.visible = false;
				} else {
					ref.current.visible = true;
				}
			}
			// Draw the vertical line from the sensor plane to the ship
			if (playerShip.r && ref.current?.position && mesh.current?.position) {
				const planeVector = upVector
					.clone()
					.applyQuaternion(
						playerQuaternion.set(
							playerShip.r.x,
							playerShip.r.y,
							playerShip.r.z,
							playerShip.r.w,
						),
					);
				plane.set(planeVector, 0);
				plane.projectPoint(ref.current.position, mesh.current.position);
				const positions = [
					...ref.current.position.toArray(),
					...mesh.current.position.toArray(),
				];
				line.current?.geometry.setPositions(positions);
				if (mesh.current && line.current)
					if (tilted) {
						mesh.current.visible = true;
						line.current.visible = true;
					} else {
						mesh.current.visible = false;
						line.current.visible = false;
					}
			}
		}
	});
	return (
		<>
			<mesh ref={ref} visible={false} scale={[0.5, 0.2, 1]}>
				<icosahedronGeometry args={[1, 1]} />
				<meshBasicMaterial color="black" />
				<Outlines thickness={0.2} color={color} />
				<Edges color={color} threshold={15} />
			</mesh>
			{isDestroyed ? (
				<group ref={explosionRef}>
					<Explosion />
				</group>
			) : null}
			<Line
				ref={line}
				points={[
					[0, 0, 0],
					[0, 0, 0],
				]}
				color={"white"}
				lineWidth={1}
			/>
			<mesh ref={mesh}>
				<planeGeometry args={[0.01, 0.01]} attach="geometry" />
				<meshBasicMaterial attach="material" color="white" side={DoubleSide} />
			</mesh>
		</>
	);
}

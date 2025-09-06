import { Edges, Line, Outlines, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import {
	useRef,
	Suspense,
	memo,
	useMemo,
	Fragment,
	type RefObject,
	useImperativeHandle,
} from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { isPlanet, isStar } from "@thorium/ecs-components/list";
import type { satellite } from "@thorium/ecs-components/satellite";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { degToRad, solarRadiusToKilometers } from "@thorium/utils/unitTypes";
import {
	type BufferAttribute,
	type Camera,
	CylinderGeometry,
	DoubleSide,
	type Group,
	type Mesh,
	MeshBasicMaterial,
	type Object3D,
	type OrthographicCamera,
	Plane,
	Quaternion,
	RingGeometry,
	Sphere,
	type Sprite,
	Vector3,
} from "three";
import type { Line2 } from "three-stdlib";
import { useGetFacingWaypoint, useCircleGridStore } from "./useCircleGridStore";
import { WaypointEntity } from "./Waypoint";
import { useLiveQuery } from "@thorium/utils/live-query/client/liveQueryContext";
import { q } from "@thorium/context/AppContext";
import { setCursor } from "@thorium/utils/setCursor";
import ReticleTexture from "@thorium/cards/Pilot/reticle.svg";
import BracketTexture from "@thorium/cards/Pilot/bracket.svg";
import UnidentifiedTexture from "@thorium/cards/Pilot/unidentified.svg";
import Explosion from "@thorium/components/Starmap/Effects/Explosion";
import { isObjectOccludedBySphere } from "@thorium/utils/starmap/isObjectOccludedBySphere";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import { useShipSprite } from "@thorium/components/Starmap/StarmapShip";
import { useCardContext } from "@thorium/context/CardContext";

export function CircleGridContacts({
	onContactClick,
	onPlanetClick,
	targetedContactId,
	selectedContactId,
	onContactOcclusion,
}: {
	onContactClick?: (id: number) => void;
	onPlanetClick?: (id: number) => void;
	onContactOcclusion?: (id: number, occluded: boolean) => void;
	targetedContactId?: number;
	selectedContactId?: number | null;
}) {
	const store = useCircleGridStore();
	const tilted = store((store) => store.tilt > 0);
	const useStarmapStore = useGetStarmapStore();
	const systemId = useStarmapStore((store) => store.currentSystem);
	const [orbs] = q.starmapCore.entities.useNetRequest({
		systemId,
	});
	const [ships] = q.starmapCore.ships.useNetRequest({ systemId });
	const [torpedos] = q.starmapCore.torpedos.useNetRequest({ systemId });

	return (
		<group>
			{orbs.map((entity) => {
				const { satellite, isPlanet, isStar } = entity.components;
				if (!satellite) return null;
				return (
					<PlanetaryEntity
						key={entity.id}
						id={entity.id}
						satellite={satellite}
						isPlanet={isPlanet}
						isStar={isStar}
						onClick={onPlanetClick}
						isSelected={selectedContactId === entity.id}
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
								systemId={systemId}
								modelUrl={modelUrl}
								logoUrl={logoUrl}
								size={size}
								tilted={tilted}
								onClick={onContactClick}
								isTargeted={targetedContactId === id}
								isSelected={selectedContactId === id}
								onContactOcclusion={onContactOcclusion}
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
	const { shipId } = useStation();
	const [waypoints] = q.waypoints.all.useNetRequest({
		systemId: "all",
		shipId,
	});
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
const position = new Vector3();
const sphere = new Sphere();
export const ShipEntity = ({
	id,
	systemId,
	modelUrl,
	logoUrl,
	size,
	tilted,
	onClick,
	isTargeted,
	isSelected,
	onContactOcclusion,
}: {
	id: number;
	systemId: number | null;
	modelUrl: string;
	logoUrl: string;
	size: number;
	tilted?: boolean;
	onClick?: (id: number) => void;
	isTargeted?: boolean;
	isSelected?: boolean;
	onContactOcclusion?: (id: number, occluded: boolean) => void;
}) => {
	const { shipId } = useStation();
	const [orbs] = q.starmapCore.entities.useNetRequest({
		systemId,
	});
	const [scanResults] = q.sensors.scanResult.useNetRequest({
		shipId,
		objectId: id,
	});
	const isIdentified = scanResults.identification;

	// TODO: Use useGLTF.preload outside of this to preload the asset
	const model = useGLTF(modelUrl || "", false);

	// biome-ignore lint/correctness/useExhaustiveDependencies:
	const scene = useMemo(() => {
		const scene: Object3D = model.scene.clone(true);
		if (scene.traverse) {
			scene.traverse((object: Object3D | Mesh) => {
				if ("material" in object) {
					(Array.isArray(object.material)
						? object.material
						: [object.material]
					).forEach((mat) => mat.dispose());
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

	const spriteMap = useShipSprite(logoUrl);
	const reticleMap = useShipSprite(ReticleTexture);
	const unidentifiedMap = useShipSprite(UnidentifiedTexture);

	const scale = 1 / 50;
	const mesh = useRef<Mesh>(null);
	const line = useRef<Line2>(null);
	const sprite = useRef<Sprite>(null);
	const reticle = useRef<Sprite>(null);
	const bracket = useRef<Group | null>(null);
	const shipRef = useRef<Group>(null);
	const arrowRef = useRef<Group>(null);
	const isOccludedRef = useRef(false);
	useFrame((props) => {
		const camera = props.camera as OrthographicCamera;
		const dx = (camera.right - camera.left) / (2 * camera.zoom);
		const ship = interpolate(id);
		const playerShip = interpolate(shipId);
		const playerPosition = playerShip || zeroVector;
		if (arrowRef.current) {
			arrowRef.current.visible = true;
		}
		if (!ship || !playerPosition || !playerShip) return;
		if (shipRef.current) {
			if (size && dx / (size / 1000) < 50) {
				if (sprite.current) {
					sprite.current.visible = false;
				}
				if (arrowRef.current) {
					arrowRef.current.visible = false;
				}
				shipRef.current.visible = true;
			} else {
				if (arrowRef.current) {
					arrowRef.current.visible = true;
				}
				if (sprite.current) {
					sprite.current.visible = true;
				}
				shipRef.current.visible = false;
			}
		}
		if (ship) {
			// We calculate orbs for occlusion purposes. We only want orbs that are closer
			// to the player ship than the current ship.
			let isOccluded = false;
			for (const orb of orbs) {
				const { satellite, isPlanet, isStar } = orb.components;
				if (!satellite) continue;
				const size = isPlanet
					? isPlanet.radius
					: isStar
						? solarRadiusToKilometers(isStar.radius)
						: 0;
				if (size === 0) continue;

				const position = getOrbitPosition({
					semiMajorAxis: satellite.semiMajorAxis,
					eccentricity: satellite.eccentricity,
					orbitalArc: satellite.orbitalArc,
					inclination: satellite.inclination,
				});

				sphere.set(sphere.center.set(position.x, position.y, position.z), size);
				isOccluded = isObjectOccludedBySphere(playerPosition, ship, sphere);

				if (isOccluded) break;
			}

			if (isOccluded) {
				if (shipRef.current) {
					shipRef.current.visible = false;
				}
				if (sprite.current) {
					sprite.current.visible = false;
				}
				if (arrowRef.current) {
					arrowRef.current.visible = false;
				}
				if (mesh.current && line.current) {
					mesh.current.visible = false;
					line.current.visible = false;
				}
				if (isOccludedRef.current === false) {
					onContactOcclusion?.(id, true);
				}

				isOccludedRef.current = true;
				return;
			}
			if (isOccludedRef.current === true) {
				onContactOcclusion?.(id, false);
			}
			isOccludedRef.current = false;

			position.set(
				ship.x - playerPosition.x,
				ship.y - playerPosition.y,
				ship.z - playerPosition.z,
			);
			// Since the sensor grid needs to be oriented at 0,0,0
			// to properly tilt, we reposition the contacts relative
			// to the player ship's position.
			sprite.current?.position.copy(position);
			reticle.current?.position.copy(position);
			shipRef.current?.position.copy(position);
			arrowRef.current?.position.copy(position);

			shipRef.current?.scale.setScalar(size / 1000 || 0.5);
			// This scale is helpful if we want to see the ships orientation in space.
			arrowRef.current?.scale.setScalar((dx * 20) / 1000);
			if (ship.r) {
				if (shipRef.current) {
					shipRef.current?.quaternion.set(
						ship.r.x,
						ship.r.y,
						ship.r.z,
						ship.r.w,
					);
				}
				arrowRef.current?.quaternion.set(
					ship.r.x,
					ship.r.y,
					ship.r.z,
					ship.r.w,
				);
			}

			// Draw the vertical line from the sensor plane to the ship
			if (playerShip.r && mesh.current?.position) {
				playerQuaternion.set(
					playerShip.r.x,
					playerShip.r.y,
					playerShip.r.z,
					playerShip.r.w,
				);

				const planeVector = upVector
					.set(0, 1, 0)
					.applyQuaternion(playerQuaternion);
				plane.set(planeVector, 0);
				plane.projectPoint(position, mesh.current.position);
				const positions = [
					...position.toArray(),
					...mesh.current.position.toArray(),
				];
				line.current?.geometry.setPositions(positions);
				if (mesh.current && line.current) {
					if (tilted) {
						mesh.current.visible = true;
						line.current.visible = true;
					} else {
						mesh.current.visible = false;
						line.current.visible = false;
					}
				}
			}
		}
		sprite.current?.scale.setScalar(dx * 3 * scale);
		reticle.current?.scale.setScalar(dx * 4 * scale);
		bracket.current?.children.forEach((child, i) => {
			const bracketPosition = getBracketPosition(
				size / 1000,
				i,
				playerQuaternion,
			);
			child.position.copy(position).add(bracketPosition);
			child.scale.setScalar(dx / 15);
		});

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

	const eventHandlers = {
		onPointerDown: () => onClick?.(id),
		onPointerOver: () => {
			if (onClick) {
				setCursor("pointer");
			}
		},
		onPointerOut: () => {
			setCursor("auto");
		},
	};
	return (
		<Fragment>
			<group ref={shipRef} {...eventHandlers}>
				<primitive object={scene} rotation={[Math.PI / 2, Math.PI, 0]} />
			</group>
			{id !== shipId && (
				<Fragment>
					<sprite ref={sprite} {...eventHandlers}>
						<spriteMaterial
							attach="material"
							map={isIdentified ? spriteMap : unidentifiedMap}
							color={"white"}
							sizeAttenuation={true}
						/>
					</sprite>
					{/* This could be an instance mesh for every contact if we wanted to be really fancy... */}
					<group ref={arrowRef} {...eventHandlers}>
						<mesh position={[0, 0, 3]} rotation={[Math.PI / 2, 0, 0]}>
							<coneGeometry args={[1, 1, 2]} />
							<meshBasicMaterial color={0xffffff} />
						</mesh>
					</group>

					<sprite ref={reticle} visible={isTargeted}>
						<spriteMaterial
							depthTest={false}
							attach="material"
							map={reticleMap}
							color={"red"}
							sizeAttenuation={true}
						/>
					</sprite>
					<SensorsBracket bracket={bracket} isSelected={isSelected} />

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
	id: number;
	satellite: Zod.infer<typeof satellite>;
	isPlanet?: Zod.infer<typeof isPlanet>;
	isStar?: Zod.infer<typeof isStar>;
	onClick?: (id: number) => void;
	isSelected?: boolean;
}

export const PlanetaryEntity = memo(
	({
		id,
		satellite,
		isPlanet,
		isStar,
		onClick,
		isSelected,
	}: PlanetaryEntityProps) => {
		const { shipId } = useStation();
		const { interpolate } = useLiveQuery();

		const bracket = useRef<Group>(null);
		const size = isPlanet
			? isPlanet.radius
			: isStar
				? solarRadiusToKilometers(isStar.radius)
				: 0;
		const position = getOrbitPosition({
			semiMajorAxis: satellite.semiMajorAxis,
			eccentricity: satellite.eccentricity,
			orbitalArc: satellite.orbitalArc,
			inclination: satellite.inclination,
		});

		const store = useCircleGridStore();

		const sensorRange = store((store) => store.zoomMax);

		const ref = useRef<Group>(null);
		useFrame((props) => {
			const camera = props.camera as OrthographicCamera;
			const dx = (camera.right - camera.left) / (2 * camera.zoom);

			const playerShip = interpolate(shipId);
			if (!playerShip || (!isPlanet && !isStar) || !satellite) return;

			ref.current?.position.set(
				position.x - playerShip.x,
				position.y - playerShip.y,
				position.z - playerShip.z,
			);
			if (playerShip.r) {
				playerQuaternion.set(
					playerShip.r.x,
					playerShip.r.y,
					playerShip.r.z,
					playerShip.r.w,
				);
			}
			bracket.current?.children.forEach((child, i) => {
				const bracketPosition = getBracketPosition(size, i, playerQuaternion);
				child.position
					.set(
						position.x - playerShip.x,
						position.y - playerShip.y,
						position.z - playerShip.z,
					)
					.add(bracketPosition);
				child.scale.setScalar(dx / 15);
			});
		});
		if ((!isPlanet && !isStar) || !satellite) return null;

		return (
			<>
				<group
					ref={ref}
					scale={[size, size, size]}
					rotation={[0, 0, degToRad(satellite.axialTilt)]}
				>
					<mesh
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
						<icosahedronGeometry args={[1, 3]} attach="geometry" />
						<meshBasicMaterial wireframe color="white" attach="material" />
					</mesh>
					{isPlanet?.ringMapAsset && <BasicRings />}
				</group>
				<SensorsBracket bracket={bracket} isSelected={isSelected} />
				{isPlanet ? (
					<OcclusionCone
						size={size}
						id={id}
						sensorRange={sensorRange}
						satellite={satellite}
					/>
				) : null}
			</>
		);
	},
);

const position1 = new Vector3();
const position2 = new Vector3();
const direction = new Vector3();
function OcclusionCone({
	id,
	size,
	sensorRange,
	satellite: sat,
}: {
	id: number;
	sensorRange: number;
	size: number;
	satellite: Zod.infer<typeof satellite>;
}) {
	const { cardLoaded } = useCardContext();
	const position = getOrbitPosition({
		semiMajorAxis: sat.semiMajorAxis,
		eccentricity: sat.eccentricity,
		orbitalArc: sat.orbitalArc,
		inclination: sat.inclination,
	});

	const { shipId } = useStation();
	const { interpolate } = useLiveQuery();
	const ref = useRef<Group>(null);
	const cylinderRef = useRef<Mesh>(null);

	useAnimationFrame(() => {
		const playerShip = interpolate(shipId);
		if (!playerShip) return;
		position1.set(playerShip.x, playerShip.y, playerShip.z);
		position2.set(position.x, position.y, position.z);
		direction.subVectors(position2, position1);
		const distance = direction.length();
		ref.current?.position.copy(direction);
		direction.normalize();
		upVector.set(0, -1, 0);
		ref.current?.quaternion.setFromUnitVectors(upVector, direction);

		const distantRadius =
			(sensorRange * Math.sin(Math.atan2(size, distance))) / size;
		const geometry = new CylinderGeometry(
			1, // radius at top
			distantRadius, // radius at bottom
			sensorRange / size, // height
			32, // radial segments
		);
		if (cylinderRef.current) {
			cylinderRef.current.geometry.dispose();
			cylinderRef.current.geometry = geometry;
		}
	}, cardLoaded);
	return (
		<group ref={ref} scale={[size, size, size]}>
			<mesh
				position={[0, -sensorRange / size / 2, 0]}
				renderOrder={-1}
				ref={cylinderRef}
			>
				<cylinderGeometry args={[1, 1, sensorRange / size, 8]} />
				<meshBasicMaterial
					color={0x333333}
					depthTest={false}
					side={DoubleSide}
				/>
			</mesh>
			<mesh position={[0, 0, 0]} renderOrder={-1}>
				<sphereGeometry args={[1]} />
				<meshBasicMaterial
					color={0x333333}
					depthTest={false}
					side={DoubleSide}
				/>
			</mesh>
		</group>
	);
}

function getBracketPosition(
	positionScalar: number,
	index: number,
	quaternion: Quaternion,
) {
	return [
		new Vector3(positionScalar, 0, positionScalar).applyQuaternion(quaternion),
		new Vector3(positionScalar, 0, -positionScalar).applyQuaternion(quaternion),
		new Vector3(-positionScalar, 0, -positionScalar).applyQuaternion(
			quaternion,
		),
		new Vector3(-positionScalar, 0, positionScalar).applyQuaternion(quaternion),
	][index];
}

const SensorsBracket = ({
	bracket,
	isSelected,
}: { bracket: RefObject<Group | null>; isSelected?: boolean }) => {
	const bracketMap = useShipSprite(BracketTexture);
	const positionScalar = 0.05;
	const scaleScalar = 0.15;
	return (
		<group ref={bracket} visible={isSelected}>
			<sprite
				scale={scaleScalar}
				position={[positionScalar, 0, positionScalar]}
			>
				<spriteMaterial
					depthTest={false}
					attach="material"
					map={bracketMap}
					color={0x0088ff}
					sizeAttenuation={false}
					depthWrite={false}
				/>
			</sprite>
			<sprite
				scale={scaleScalar}
				position={[positionScalar, 0, -positionScalar]}
			>
				<spriteMaterial
					rotation={Math.PI / 2}
					depthTest={false}
					attach="material"
					map={bracketMap}
					color={0x0088ff}
					sizeAttenuation={false}
					depthWrite={false}
				/>
			</sprite>
			<sprite
				scale={scaleScalar}
				position={[-positionScalar, 0, -positionScalar]}
			>
				<spriteMaterial
					rotation={Math.PI}
					depthTest={false}
					attach="material"
					map={bracketMap}
					color={0x0088ff}
					sizeAttenuation={false}
					depthWrite={false}
				/>
			</sprite>
			<sprite
				scale={scaleScalar}
				position={[-positionScalar, 0, positionScalar]}
			>
				<spriteMaterial
					rotation={-Math.PI / 2}
					depthTest={false}
					attach="material"
					map={bracketMap}
					color={0x0088ff}
					sizeAttenuation={false}
					depthWrite={false}
				/>
			</sprite>
		</group>
	);
};

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
		<mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.7, 0.7, 0.7]} geometry={geo}>
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
	const { shipId } = useStation();

	useFrame((props) => {
		const camera = props.camera as OrthographicCamera;
		const dx = (camera.right - camera.left) / (2 * camera.zoom);
		ref.current?.scale.set(0.5, 0.2, 1).multiplyScalar(dx * 0.02);

		const torpedo = interpolate(id);
		const playerShip = interpolate(shipId);
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
					.set(0, 1, 0)
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

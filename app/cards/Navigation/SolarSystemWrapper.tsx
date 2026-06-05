import { useFrame } from "@react-three/fiber";
import { keepPreviousData } from "@tanstack/react-query";
import OrbitContainer, { OrbitLine } from "@thorium/components/Starmap/OrbitContainer";
import { planetSpriteScale } from "@thorium/components/Starmap/Planet";
import { PlanetSprite } from "@thorium/components/Starmap/Planet";
import { SolarSystemMap } from "@thorium/components/Starmap/SolarSystemMap";
import { StarSprite } from "@thorium/components/Starmap/Star/StarMesh";
import { StarmapShip } from "@thorium/components/Starmap/StarmapShip";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import SystemLabel from "@thorium/components/Starmap/SystemMarker/SystemLabel";
import { WaypointEntity } from "@thorium/components/Starmap/WaypointEntity";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { setCursor } from "@thorium/utils/setCursor";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { Coordinates, degToRad, solarRadiusToKilometers } from "@thorium/utils/unitTypes";
import { useEffect, useMemo, useRef } from "react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Color, type Group } from "three";

export function SolarSystemWrapper() {
	const { shipId } = useStation();
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);

	const [system] = q.starmapCore.system.useNetRequest(
		{
			systemId: currentSystem!,
		},
		{ placeholderData: keepPreviousData, enabled: currentSystem !== null },
	);
	const [starmapEntities] = q.starmapCore.entities.useNetRequest({
		systemId: currentSystem,
	});
	const [ship] = q.navigation.ship.useNetRequest({ shipId });
	const [waypoints] = q.waypoints.all.useNetRequest({
		shipId,
		active: false,
		systemId: currentSystem,
	});
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });

	useEffect(() => {
		useStarmapStore.getState().currentSystemSet?.(currentSystem);
	}, [useStarmapStore, currentSystem]);

	if (currentSystem === null) return null;

	return (
		<SolarSystemMap
			minDistance={10000}
			skyboxKey={system?.components.isSolarSystem?.skyboxKey || "Blank"}
		>
			{starmapEntities.map((entity) => {
				if (entity.components.isStar) {
					if (!entity.components.satellite) return null;
					const size = solarRadiusToKilometers(entity.components.isStar.radius);

					const color = new Color(
						`hsl(${entity.components.isStar.hue}, 100%, ${
							entity.components.isStar.isWhite ? 100 : 50
						}%)`,
					);
					return (
						<OrbitContainer key={entity.id} {...entity.components.satellite}>
							<group
								scale={[size, size, size]}
								onPointerOver={() => {
									setCursor("pointer");
								}}
								onPointerOut={() => {
									setCursor("auto");
								}}
								onClick={() => {
									if (entity.components.satellite) {
										const position = getOrbitPosition(entity.components.satellite);
										useStarmapStore.getState().setCameraFocus(position);
									}

									useStarmapStore.setState({ selectedObjectIds: [entity.id] });
								}}
							>
								<StarSprite size={size} color1={color} userData={{ type: "star", id: entity.id }} />
							</group>
						</OrbitContainer>
					);
				}
				if (entity.components.isPlanet) {
					if (!entity.components.satellite) return null;

					return (
						<PlanetRenderer
							key={entity.id}
							name={entity.components.identity?.name}
							satellite={entity.components.satellite}
							onClick={(position: Coordinates<number>) => {
								useStarmapStore.setState({ selectedObjectIds: [entity.id] });
								useStarmapStore.getState().setCameraFocus(position);
							}}
						/>
					);
				}
				return null;
			})}
			{ship.position?.parentId === currentSystem && (
				<Suspense key={ship.id} fallback={null}>
					<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
						<StarmapShip id={ship.id} logoUrl={ship.icon} size={ship.size} spriteColor={0x0088ff} />
					</ErrorBoundary>
				</Suspense>
			)}
			{waypoints.map((waypoint) => (
				<Suspense key={waypoint.id}>
					<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
						<WaypointEntity
							position={waypoint.position}
							isActive={waypoint.isActive}
							isFacing={waypoint.id === autopilot.facingWaypointIds[0]}
							isLocked={waypoint.id === autopilot.destinationWaypointId}
						/>
					</ErrorBoundary>
				</Suspense>
			))}
		</SolarSystemMap>
	);
}

function PlanetRenderer({
	name,
	satellite,
	onClick,
}: {
	name?: string;
	satellite: {
		axialTilt: number;
		semiMajorAxis: number;
		eccentricity: number;
		inclination: number;
		orbitalArc: number;
		parentId: number | null;
	};
	onClick: (position: Coordinates<number>) => void;
}) {
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);

	const [starmapEntities] = q.starmapCore.entities.useNetRequest({
		systemId: currentSystem,
	});

	const labelRef = useRef<Group>(null);

	const origin = useMemo(() => {
		const parent = starmapEntities.find((s) => s.id === satellite.parentId)?.components.satellite;
		if (!parent) return undefined;
		return getOrbitPosition(parent);
	}, [starmapEntities, satellite.parentId]);
	const position = getOrbitPosition({ ...satellite, origin });
	const { semiMajorAxis, eccentricity, inclination } = satellite;
	const radiusY = semiMajorAxis - semiMajorAxis * eccentricity;

	useFrame(({ camera }) => {
		if (labelRef.current) {
			const zoom = camera.position.distanceTo(position) + 500;
			const zoomedScale = (zoom / 2) * 0.01;
			labelRef.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
			labelRef.current.quaternion.copy(camera.quaternion);
		}
	});

	return (
		<group>
			<group position={origin} rotation={[0, 0, degToRad(inclination)]}>
				<OrbitLine radiusX={semiMajorAxis} radiusY={radiusY} />
			</group>
			<group position={position}>
				<Suspense fallback={null}>
					<group
						scale={[planetSpriteScale, planetSpriteScale, planetSpriteScale]}
						onPointerOver={() => {
							setCursor("pointer");
						}}
						onPointerOut={() => {
							setCursor("auto");
						}}
						onClick={onClick}
					>
						<PlanetSprite />
					</group>
				</Suspense>
				{name && (
					<group ref={labelRef}>
						<SystemLabel
							systemId=""
							name={name}
							hoveringDirection={{ current: 0 }}
							scale={5 / 128}
						/>
					</group>
				)}
			</group>
		</group>
	);
}

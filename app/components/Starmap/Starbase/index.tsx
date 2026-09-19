import { useFrame } from "@react-three/fiber";
import { OrbitLine } from "@thorium/components/Starmap/OrbitContainer";
import Selected from "@thorium/components/Starmap/Selected";
import { ShipSprite } from "@thorium/components/Starmap/ShipSprite";
import { useShipModel } from "@thorium/components/Starmap/StarmapShip";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import SystemLabel from "@thorium/components/Starmap/SystemMarker/SystemLabel";
import { setCursor } from "@thorium/utils/setCursor";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { degToRad } from "@thorium/utils/unitTypes";
import { Suspense, useMemo, useRef } from "react";
import type { Group } from "three";

export function Starbase({
	starbase,
	entities,
	onClick,
	showSprite,
	showMesh,
	isSatellite,
}: {
	isSatellite?: boolean;
	starbase: {
		id: string | number;
		name: string;
		isStarbase: {
			assets: { model?: string | undefined; logo?: string | undefined };
		};
		length: number;
		mass: number;
		population: number;
		satellite: {
			axialTilt: number;
			semiMajorAxis: number;
			eccentricity: number;
			orbitalArc: number;
			inclination: number;
			parentId: string | number | undefined | null;
			showOrbit: boolean;
		};
	};
	entities?: {
		id: number | string;
		satellite: {
			axialTilt: number;
			semiMajorAxis: number;
			eccentricity: number;
			orbitalArc: number;
			inclination: number;
			showOrbit: boolean;
		};
	}[];
	showSprite?: boolean;
	showMesh?: boolean;
	onClick?: () => void;
}) {
	const useStarmapStore = useGetStarmapStore();

	const starbaseSpriteScale = 1;

	const selected = useStarmapStore((state) => state.selectedObjectIds.includes(starbase.id));
	const {
		id,
		name,
		isStarbase: {
			assets: { logo: logoUrl, model: modelUrl },
		},
		length,
	} = starbase;
	const size = length / 1000; // Length is in meters; size is in kilometers
	const { axialTilt, inclination, semiMajorAxis, eccentricity } = starbase.satellite;
	const viewingMode = useStarmapStore((state) => state.viewingMode);
	const model = useShipModel(modelUrl);

	const origin = useMemo(() => {
		const parent = entities?.find((s) => s.id === starbase.satellite.parentId)?.satellite;
		if (!parent) return undefined;
		return getOrbitPosition(parent);
	}, [entities, starbase.satellite.parentId]);

	const position = getOrbitPosition({ ...starbase.satellite, origin });

	function onPointerOver() {
		if (viewingMode === "viewscreen") return;

		setCursor("pointer");
	}
	function onPointerOut() {
		setCursor("auto");
	}

	const groupRef = useRef<Group>(null);
	const labelRef = useRef<Group>(null);
	const starbaseSpriteRef = useRef<Group>(null);
	const starbaseMeshRef = useRef<Group>(null);

	onClick =
		onClick ||
		(() => {
			if (viewingMode === "viewscreen" || groupRef.current?.visible === false) return;
			useStarmapStore.getState().setCameraFocus(position);
			useStarmapStore.setState({
				selectedObjectIds: [starbase.id],
			});
		});

	useFrame(({ camera }) => {
		if (labelRef.current) {
			const zoom = camera.position.distanceTo(position) + 500;
			const zoomedScale = (zoom / 2) * 0.01;
			labelRef.current.scale.set(zoomedScale, zoomedScale, zoomedScale);
			labelRef.current.quaternion.copy(camera.quaternion);
		}

		const distance = camera.position.distanceTo(position);

		if (starbaseSpriteRef.current && starbaseMeshRef.current) {
			if (
				size &&
				distance / size > 100 &&
				(viewingMode === "core" || viewingMode === "editor" || showSprite)
			) {
				starbaseSpriteRef.current.visible = true;
				starbaseMeshRef.current.visible = false;
			} else if (showMesh) {
				starbaseSpriteRef.current.visible = false;
				starbaseMeshRef.current.visible = true;
			}
		}
		if (groupRef.current && isSatellite) {
			if (distance / semiMajorAxis > 20 && (viewingMode === "core" || viewingMode === "editor")) {
				groupRef.current.visible = false;
			} else {
				groupRef.current.visible = true;
			}
		}
	});

	const radiusY = semiMajorAxis - semiMajorAxis * eccentricity;

	return (
		<group>
			{viewingMode !== "viewscreen" && starbase.satellite.showOrbit && (
				<group position={origin} rotation={[0, 0, degToRad(inclination)]}>
					<OrbitLine radiusX={semiMajorAxis} radiusY={radiusY} />
				</group>
			)}
			<group position={position} ref={groupRef}>
				<group onPointerOver={onPointerOver} onPointerOut={onPointerOut} onClick={onClick}>
					<Suspense fallback={null}>
						{logoUrl && (
							<group
								ref={starbaseSpriteRef}
								scale={[starbaseSpriteScale, starbaseSpriteScale, starbaseSpriteScale]}
							>
								<ShipSprite
									color={selected ? "#0088ff" : "white"}
									userData={{ type: "starbase", id }}
									spriteAsset={logoUrl}
								/>
							</group>
						)}
						{model && (
							<group
								ref={starbaseMeshRef}
								scale={[size, size, size]}
								rotation={[0, 0, degToRad(axialTilt)]}
							>
								<primitive
									// Convert meters to kilometers
									scale={size / 1000}
									userData={{ type: "starbase", id }}
									object={model}
									rotation={[Math.PI / 2, Math.PI, 0]}
								/>
								{selected && <Selected />}
							</group>
						)}
					</Suspense>
				</group>
				{viewingMode !== "viewscreen" && (
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

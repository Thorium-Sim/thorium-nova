import { Line, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clientId, q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { setCursor } from "@thorium/utils/setCursor";
import type { Meter } from "@thorium/utils/unitTypes";
import { type RefObject, Suspense, useMemo, useRef } from "react";
import {
	Color,
	FrontSide,
	type Group,
	type Mesh,
	type MeshStandardMaterial,
	Object3D,
	type Vector3,
} from "three";
import type { Line2 } from "three-stdlib";
import { PhasersVisualization } from "./PhasersVisualization";
import { ShipSprite } from "./ShipSprite";
import { useGetStarmapStore } from "./starmapStore";
import { ErrorBoundary } from "react-error-boundary";

export function StarmapShip({
	id,
	modelUrl,
	logoUrl,
	spriteColor = "white",
	onClick,
	size,
	dragMovement,
	onPointerDown,
	onPointerUp,
	onPointerMove,
}: {
	id: number;
	modelUrl?: string;
	logoUrl?: string;
	spriteColor?: number | string;
	size: Meter;
	dragMovement?: RefObject<Vector3 | null> | null;
	onClick?: (event: MouseEvent) => void;
	onPointerDown?: (event: PointerEvent) => void;
	onPointerMove?: (event: PointerEvent) => void;
	onPointerUp?: (event: PointerEvent) => void;
}) {
	const model = useShipModel(modelUrl);

	const useStarmapStore = useGetStarmapStore();
	const isSelected = useStarmapStore(
		(store) => store.selectedObjectIds,
	).includes(id);
	const systemId = useStarmapStore((store) => store.currentSystem);

	const [autopilotData] = q.starmapCore.autopilot.useNetRequest(
		{ systemId },
		{ refetchInterval: 3000 },
	);

	const shipAutopilot = autopilotData[id];
	const { shipId, ship } = useStation();

	const isNotViewscreen = useStarmapStore(
		(store) => store.viewingMode !== "viewscreen",
	);
	const isCore = useStarmapStore((store) => store.viewingMode === "core");
	const sensorsHidden = useStarmapStore((store) => store.sensorsHidden);
	const group = useRef<Group>(null);
	const dragging = useRef<Group>(null);
	const shipMesh = useRef<Group>(null);
	const shipSprite = useRef<Group>(null);
	const { interpolate } = useLiveQuery();
	const lineRef = useRef<Line2>(null);
	useFrame(() => {
		if (!group.current) return;
		const state = interpolate(id);
		if (!state) {
			group.current.visible = false;
			return;
		}
		group.current.visible = true;
		group.current.position.set(state.x, state.y, state.z);
		if (dragging.current && dragMovement?.current) {
			dragging.current.position
				.set(state.x, state.y, state.z)
				.add(dragMovement.current);
			dragging.current.visible = true;
		}
		if (dragging.current && !dragMovement?.current) {
			dragging.current.visible = false;
		}
		shipMesh.current?.quaternion.set(
			state.r.x,
			state.r.y,
			state.r.z,
			state.r.w,
		);
		if (shipMesh.current) {
			if (!isNotViewscreen && shipId === id) {
				shipMesh.current.visible = false;
			} else {
				shipMesh.current.visible = true;
			}
		}

		// Autopilot Destination
		if (lineRef.current && group.current) {
			if (
				isCore &&
				// TODO September 14, 2022 - Make it so you can toggle autopilot lines on and off
				// useConfigStore.getState().includeAutopilotData &&
				shipAutopilot?.destinationPosition
			) {
				const destinationPosition =
					shipAutopilot.path.length > 0
						? shipAutopilot.path
						: [
								ship.currentSystem
									? shipAutopilot.destinationPosition
									: shipAutopilot.destinationSystemPosition ||
										shipAutopilot.destinationPosition,
							];

				lineRef.current.geometry.setPositions([
					group.current.position.x,
					group.current.position.y,
					group.current.position.z,
					...destinationPosition.flatMap(({ x, y, z }) => [x, y, z]),
				]);
				lineRef.current.geometry.attributes.position.needsUpdate = true;
				lineRef.current.visible = true;
			} else {
				lineRef.current.visible = false;
			}
		}
	});

	return (
		<group>
			{/* Points towards the current destination */}
			<Line
				ref={lineRef}
				points={[
					[1, 1, 1],
					[2, 2, 2],
				]} // Array of points
				color="white"
				opacity={0.25}
				transparent
				lineWidth={0.5} // In pixels (default)
			/>

			<group ref={dragging}>
				{isNotViewscreen && (
					<Suspense fallback={null}>
						<group ref={shipSprite}>
							{logoUrl && (
								<ShipSprite
									// TODO June 9, 2022 - This color should represent the faction, with a toggle to make it show IFF for the current ship
									color={spriteColor}
									spriteAsset={logoUrl}
									userData={{ type: "ship", id }}
									opacity={0.5}
								/>
							)}
						</group>
					</Suspense>
				)}
			</group>
			<group ref={group}>
				{!isCore || sensorsHidden || !isSelected ? null : (
					<Suspense>
						<SensorRanges id={id} />
					</Suspense>
				)}
				<group
					onPointerOver={() => {
						// set the cursor to pointer
						setCursor("pointer");
					}}
					onPointerOut={() => {
						// set the cursor to default
						setCursor("auto");
					}}
					onClick={onClick}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
				>
					{isNotViewscreen && (
						<Suspense fallback={null}>
							<group ref={shipSprite}>
								{logoUrl && (
									<ShipSprite
										// TODO June 9, 2022 - This color should represent the faction, with a toggle to make it show IFF for the current ship
										color={spriteColor}
										spriteAsset={logoUrl}
										userData={{ type: "ship", id }}
									/>
								)}
							</group>
						</Suspense>
					)}
					{model && (
						<group ref={shipMesh}>
							<primitive
								// Convert meters to kilometers
								scale={size / 1000}
								userData={{ type: "ship", id }}
								object={model}
								rotation={[Math.PI / 2, Math.PI, 0]}
							/>
						</group>
					)}
				</group>
			</group>
		</group>
	);
}

function SensorRanges({ id }: { id: number }) {
	const phasersRef = useRef<Group>(null);
	const { interpolate } = useLiveQuery();

	useFrame(() => {
		const state = interpolate(id);
		if (!state) return;
		phasersRef.current?.quaternion.set(
			state.r.x,
			state.r.y,
			state.r.z,
			state.r.w,
		);
	});

	return (
		<group rotation={[0, Math.PI, 0]}>
			{/* Pilot Range */}
			<mesh>
				<icosahedronGeometry args={[10_000, 1]} />
				<meshBasicMaterial
					color="#0088ff"
					transparent
					opacity={0.2}
					wireframe
				/>
			</mesh>
			{/* Weapons Range */}
			<mesh>
				<icosahedronGeometry args={[25_000, 1]} />
				<meshBasicMaterial
					color="#ff0000"
					transparent
					opacity={0.2}
					wireframe
				/>
			</mesh>
			<ErrorBoundary fallback={null}>
				<Suspense>
					<SensorsRange shipId={id} />
				</Suspense>
			</ErrorBoundary>
			<ErrorBoundary fallback={null}>
				<Suspense>
					<CommunicationsRange shipId={id} />
				</Suspense>
			</ErrorBoundary>
			<group ref={phasersRef}>
				<Suspense>
					<PhasersVisualization shipId={id} />
				</Suspense>
			</group>
		</group>
	);
}

function SensorsRange({ shipId }: { shipId: number }) {
	const [sensors] = q.sensors.get.useNetRequest({ shipId });

	return (
		<>
			<mesh>
				<icosahedronGeometry args={[sensors.passiveRange, 1]} />
				<meshBasicMaterial
					color="#0bd0bb"
					transparent
					opacity={0.2}
					wireframe
				/>
			</mesh>
			<mesh>
				<icosahedronGeometry args={[sensors.activeRange, 1]} />
				<meshBasicMaterial
					color="#0bd0bb"
					transparent
					opacity={0.2}
					wireframe
				/>
			</mesh>
		</>
	);
}

function CommunicationsRange({ shipId }: { shipId: number }) {
	const [shortRangeComm] = q.shortRangeComm.get.useNetRequest({ shipId });
	if (!shortRangeComm) return null;
	const { maxRadius, minRadius, gain } = shortRangeComm;
	const gainRadius = minRadius + gain * (maxRadius - minRadius);
	return (
		<mesh>
			<icosahedronGeometry args={[gainRadius, 1]} />
			<meshBasicMaterial color="#ff8800" transparent opacity={0.2} wireframe />
		</mesh>
	);
}

export function useShipModel(modelAsset: string | undefined) {
	const model = useGLTF(modelAsset || "/assets/Empty.glb", false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: We want to update when modelAsset changes
	const scene = useMemo(() => {
		if (!model) return new Object3D();

		const scene: Object3D = model.scene.clone(true);
		if (scene.traverse) {
			scene.traverse((object: Object3D | Mesh) => {
				if ("material" in object) {
					const material = object.material as MeshStandardMaterial;
					material.emissiveMap = material.map;
					material.emissiveIntensity = 0.3;
					material.emissive = new Color(0xffffff);
					material.side = FrontSide;

					object.castShadow = true;
					object.receiveShadow = true;
				}
			});
		}

		return scene;
	}, [modelAsset]);

	if (!modelAsset) return null;

	return scene;
}

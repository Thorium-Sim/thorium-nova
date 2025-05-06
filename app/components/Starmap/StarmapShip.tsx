import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Suspense } from "react";
import { Line, useGLTF } from "@react-three/drei";
import {
	CanvasTexture,
	Color,
	FrontSide,
	type Group,
	type Mesh,
	type MeshStandardMaterial,
	Object3D,
	type Sprite,
	type Vector3,
} from "three";
import { useFrame } from "@react-three/fiber";
import { useGetStarmapStore } from "./starmapStore";
import type { Line2 } from "three-stdlib";
import { clientId, q } from "@thorium/context/AppContext";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { setCursor } from "@thorium/utils/setCursor";
import type { Meter } from "@thorium/utils/unitTypes";
import { suspend } from "suspend-react";
import { useTranslate2DTo3D } from "@thorium/hooks/useTranslate2DTo3D";

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

	const systemId = useStarmapStore((store) => store.currentSystem);

	const [autopilotData] = q.starmapCore.autopilot.useNetRequest(
		{ systemId },
		{ refetchInterval: 3000 },
	);

	const shipAutopilot = autopilotData[id];
	const [player] = q.ship.player.useNetRequest({ clientId });
	const playerId = player?.id;

	const isNotViewscreen = useStarmapStore(
		(store) => store.viewingMode !== "viewscreen",
	);
	const isCore = useStarmapStore((store) => store.viewingMode === "core");
	const sensorsHidden = useStarmapStore((store) => store.sensorsHidden);
	const translate = useTranslate2DTo3D();
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
			if (!isNotViewscreen && playerId === id) {
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
								player.currentSystem
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
				{/* Ship sensor range */}
				{!isCore || sensorsHidden ? null : (
					<mesh>
						<icosahedronGeometry args={[10_000, 1]} />
						<meshBasicMaterial
							color="#0088ff"
							transparent
							opacity={0.2}
							wireframe
						/>
					</mesh>
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

export function useShipModel(modelAsset: string | undefined) {
	const model = useGLTF(modelAsset || "/assets/Empty.glb", false);
	// biome-ignore lint/correctness/useExhaustiveDependencies:
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

const ShipSprite = ({
	color = "red",
	spriteAsset,
	userData,
	opacity = 1,
}: {
	color?: string | number;
	spriteAsset: string;
	userData?: any;
	opacity?: number;
}) => {
	const spriteMap = useShipSprite(spriteAsset);
	const scale = 1 / 50;
	const ref = useRef<Sprite>(null);
	useFrame(() => {
		const isSelected = false;
		// TODO May 24 2022 - this is used for showing that a ship is selected.
		// const isSelected = useSelectedShips.getState().selectedIds.includes(id);
		if (isSelected) {
			ref.current?.material.color.set("#0088ff");
		} else {
			ref.current?.material.color.set(color);
		}
	});

	return (
		<sprite ref={ref} scale={[scale, scale, scale]} userData={userData}>
			<spriteMaterial
				attach="material"
				alphaMap={spriteMap}
				color={color}
				opacity={opacity}
				transparent
				sizeAttenuation={false}
				needsUpdate={true}
				depthTest={true}
				depthWrite={false}
			/>
		</sprite>
	);
};

export function useShipSprite(spriteAsset: string) {
	const canvasDimensions = 2048;
	const [canvas] = useState(() =>
		Object.assign(document.createElement("canvas"), {
			width: canvasDimensions,
			height: canvasDimensions,
		}),
	);
	const [spriteMap] = useState(() => new CanvasTexture(canvas));
	useEffect(() => {
		const ctx = canvas.getContext("2d");
		const img = new Image();
		img.src = spriteAsset;
		img.onload = () => {
			if (!ctx) return;
			// Draw the canvas
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;
			// Convert to black and white
			for (let i = 0; i < data.length; i += 4) {
				data[i] = data[i + 1] = data[i + 2] = data[i + 3];
				// data[i + 3] = 255;
			}
			ctx.putImageData(imageData, 0, 0);
			spriteMap.needsUpdate = true;
		};
	}, [spriteAsset, canvas, spriteMap]);

	return spriteMap;
}

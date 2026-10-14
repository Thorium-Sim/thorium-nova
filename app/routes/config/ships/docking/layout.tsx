import { isSortable } from "@dnd-kit/react/sortable";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useQueryClient } from "@tanstack/react-query";
import { useShipModel } from "@thorium/components/Starmap/StarmapShip";
import { q } from "@thorium/context/AppContext";
import { useConfirm, usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { SortableList } from "@thorium/ui/SortableItem";
import { generateColliderDesc } from "@thorium/utils/physics/generateCollider";
import { cursorList, setCursor } from "@thorium/utils/setCursor";
import { use, useMemo, useRef } from "react";
import { href, Outlet, useNavigate } from "react-router";
import { Vector3 } from "three";

import type { Route } from "./+types/layout";
import { DockingPortContext, DockingPortProvider, type Coordinate } from "./context";

export default function DockingPortsList({ params }: Route.ComponentProps) {
	return (
		<DockingPortProvider>
			<PageContent {...params} />
		</DockingPortProvider>
	);
}

function PageContent({ pluginId, shipId, portId }: Route.ComponentProps["params"]) {
	const [data] = q.plugin.ship.get.useNetRequest({ pluginId, shipId });
	const confirm = useConfirm();
	const prompt = usePrompt();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { isPicking, pickedPosition, setPickedPosition, cancel, confirmPick, pickPoint } =
		use(DockingPortContext);
	const cursorRef = useRef("auto");
	const targetCursorRef = useRef<(typeof cursorList)[number]>("grab");

	const model = useGLTF(data.assets.model, false);
	const collider = useMemo(() => generateColliderDesc(model, 1), [model]);

	return (
		<>
			<div className="flex w-72 flex-col">
				<SortableList
					items={data.dockingPorts.map((d) => ({ id: d.name, children: d.name }))}
					onDragEnd={async (event) => {
						if (event.canceled || !event.operation.source || !isSortable(event.operation.source))
							return;

						const result = await q.plugin.ship.dockingPort.update.netSend({
							pluginId,
							shipId,
							portId: event.operation.source.id as string,
							newIndex: event.operation.source.index,
						});
						if (result) {
							navigate(result.name);
						}
					}}
					selectedItem={portId}
					className="mb-2"
				/>
				<Button
					className="btn-success btn-sm w-full"
					onClick={() => {
						targetCursorRef.current = "crosshair";
						pickPoint();
						navigate(".");
					}}
				>
					Add Docking Port
				</Button>
				<div className="mt-2 grid grid-cols-2 gap-2">
					<Button
						className="btn-sm"
						disabled={!(portId && portId.length > 0)}
						title={portId && portId.length > 0 ? "" : "Select a deck to be able to rename it"}
						onClick={async (event) => {
							event.preventDefault();
							event.stopPropagation();
							const newName = await prompt({
								header: "Change the current docking port's name",
								body: "Give this docking port a distinct name",
								defaultValue: portId,
								inputProps: { className: "input-error" },
							});
							if (portId && typeof portId === "string") {
								const result = await q.plugin.ship.dockingPort.update.netSend({
									pluginId,
									shipId,
									portId,
									newName,
								});
								if (result) {
									await queryClient.resetQueries({
										queryKey: q.plugin.ship.get.getQueryKey({
											pluginId,
											shipId,
										}),
									});
									navigate(
										href("/config/:pluginId/ships/:shipId/docking/:portId", {
											pluginId,
											shipId,
											portId: result.name,
										}),
									);
								}
							}
						}}
					>
						Rename
					</Button>
					<Button
						className="btn-error btn-sm"
						disabled={!portId}
						onClick={async (event) => {
							if (!portId) return;
							event.preventDefault();
							event.stopPropagation();
							if (
								await confirm({
									header: `Are you sure you want to delete docking port '${portId}'?`,
								})
							) {
								await q.plugin.ship.dockingPort.delete.netSend({
									pluginId,
									shipId,
									portId,
								});
								navigate(`.`);
							}
						}}
					>
						Delete
					</Button>
				</div>
			</div>
			<div className="max-h-72 w-full max-w-72">
				<Canvas
					gl={{ antialias: true, alpha: true }}
					frameloop="demand"
					className="aspect-square w-full rounded-xl border bg-gray-500/50"
					orthographic
					camera={{ position: [0, 0, 5], zoom: 100 }}
					onPointerEnter={() => {
						if (cursorRef.current === "auto") setCursor(targetCursorRef.current);
					}}
					onPointerLeave={() => {
						if (cursorRef.current === "auto") setCursor("auto");
					}}
					onPointerDown={(event) => {
						let currentTarget = event.currentTarget;
						cursorRef.current = "grabbing";
						setCursor("grabbing");

						document.addEventListener(
							"pointerup",
							(event) => {
								cursorRef.current = "auto";
								setCursor(
									currentTarget.contains(event.target as Node) ? targetCursorRef.current : "auto",
								);
							},
							{ once: true },
						);
					}}
				>
					<OrbitControls />

					<ShipModel
						modelUrl={data.assets.model}
						pickPosition={
							isPicking
								? ({ orientation, position }) => {
										setPickedPosition({
											orientation,
											position: subtractCenter(position, collider?.centerOfMass),
										});
									}
								: null
						}
					/>
					{pickedPosition ? (
						<DockingPort
							selected
							position={addCenter(pickedPosition.position, collider?.centerOfMass)}
							orientation={pickedPosition.orientation}
						/>
					) : null}
					{data.dockingPorts.map((port) => (
						<DockingPort
							key={port.name}
							position={addCenter(port.position, collider?.centerOfMass)}
							orientation={port.orientation}
							selected={portId === port.name}
							select={() =>
								navigate(
									href("/config/:pluginId/ships/:shipId/docking/:portId", {
										pluginId,
										shipId,
										portId: port.name,
									}),
								)
							}
						/>
					))}
				</Canvas>
				{isPicking ? (
					<div>
						<p>Click a point on the model to place the docking port.</p>
						<div className="flex gap-2">
							<Button
								className="btn-xs btn-error"
								onClick={() => {
									cancel();
									targetCursorRef.current = "grab";
								}}
							>
								Cancel
							</Button>
							<Button
								className="btn-xs btn-success"
								disabled={!pickedPosition}
								onClick={async () => {
									if (!pickedPosition) return;
									const { position, orientation } = confirmPick();
									targetCursorRef.current = "grab";

									if (portId) {
										await q.plugin.ship.dockingPort.update.netSend({
											pluginId,
											shipId,
											portId,
											position,
											orientation,
										});
									} else {
										const dockingPort = await q.plugin.ship.dockingPort.create.netSend({
											pluginId,
											shipId,
											position,
											orientation,
										});
										if (dockingPort === null) return;
										navigate(
											href("/config/:pluginId/ships/:shipId/docking/:portId", {
												pluginId,
												shipId,
												portId: dockingPort.name,
											}),
										);
									}
								}}
							>
								Save
							</Button>
						</div>
					</div>
				) : (
					<Outlet />
				)}
			</div>
		</>
	);
}

function addCenter(point: Coordinate, center: [number, number, number] = [0, 0, 0]) {
	return {
		x: point.x + center[0],
		y: point.y + center[1],
		z: point.z + center[2],
	};
}
function subtractCenter(point: Coordinate, center: [number, number, number] = [0, 0, 0]) {
	return {
		x: point.x - center[0],
		y: point.y - center[1],
		z: point.z - center[2],
	};
}
function ShipModel({
	modelUrl,
	pickPosition,
}: {
	modelUrl: string;
	pickPosition: null | ((position: { position: Coordinate; orientation: Coordinate }) => void);
}) {
	const model = useShipModel(modelUrl);
	if (!model) return null;
	return (
		<primitive
			object={model}
			rotation={[Math.PI, Math.PI, Math.PI]}
			onClick={(event: any) => {
				pickPosition?.({
					position: event.point,
					orientation: event.normal.clone().transformDirection(event.object.matrixWorld),
				});
			}}
		/>
	);
}

function DockingPort({
	position,
	orientation,
	selected,
	select,
}: {
	position: Coordinate;
	orientation: Coordinate;
	selected?: boolean;
	select?: () => void;
}) {
	const point = new Vector3(position.x, position.y, position.z);
	const normal = new Vector3(orientation.x, orientation.y, orientation.z);
	return (
		<>
			{selected && <arrowHelper args={[normal, point, 0.3, 0xffff00, 0.2, 0.1]} />}
			<mesh position={point} onClick={select}>
				<sphereGeometry args={[0.05, 16, 16]} />
				<meshBasicMaterial color={selected ? 0xff0000 : 0x00ff00} wireframe />
			</mesh>
		</>
	);
}

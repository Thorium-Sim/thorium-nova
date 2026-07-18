import { keepPreviousData } from "@tanstack/react-query";
import { ZoomSliderComp } from "@thorium/cards/Navigation/MapControls";
import { WaypointEntity } from "@thorium/cards/Pilot/Waypoint";
import { InterstellarMap } from "@thorium/components/Starmap/InterstellarMap";
import { Planet } from "@thorium/components/Starmap/Planet";
import { SolarSystemMap } from "@thorium/components/Starmap/SolarSystemMap";
import StarEntity from "@thorium/components/Starmap/Star";
import StarmapCanvas from "@thorium/components/Starmap/StarmapCanvas";
import { StarmapShip } from "@thorium/components/Starmap/StarmapShip";
import {
	StarmapStoreProvider,
	useCalculateVerticalDistance,
	useGetStarmapStore,
} from "@thorium/components/Starmap/starmapStore";
import SystemMarker from "@thorium/components/Starmap/SystemMarker";
import { Torpedo } from "@thorium/components/Starmap/Torpedo";
import { useCancelFollow } from "@thorium/components/Starmap/useCancelFollow";
import { useFollowEntity } from "@thorium/components/Starmap/useFollowEntity";
import { q } from "@thorium/context/AppContext";
import { usePickStarmapShip } from "@thorium/cores/StarmapCore/pickShip";
import useDragSelect, { DragSelection, get3dSelectedObjects } from "@thorium/hooks/useDragSelect";
import useEventListener from "@thorium/hooks/useEventListener";
import { useTranslate2DTo3D } from "@thorium/hooks/useTranslate2DTo3D";
import { useStation } from "@thorium/routes/station/useStation";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import Select from "@thorium/ui/Select";
import { Tooltip } from "@thorium/ui/Tooltip";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import type { Coordinates } from "@thorium/utils/unitTypes";
import clsx from "clsx";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { type PerspectiveCamera, Plane, Vector3 } from "three";

import { FiringPhasers } from "./FiringPhasers";
import { StarmapCoreContextMenu } from "./StarmapCoreContextMenu";

export class SelectStarmapEntityEvent extends Event {
	static name = "select-starmap-entity";
	constructor(public entityId: number) {
		super(SelectStarmapEntityEvent.name);
	}
}

export function StarmapCore() {
	const ref = useRef<HTMLDivElement>(null);

	return (
		<div className="relative h-[calc(100%-2rem)]" ref={ref}>
			<StarmapStoreProvider>
				<StarmapCoreContextMenu parentRef={ref} />
				<div className="flex items-baseline gap-2 border-b border-b-white/20 px-2 pb-0.5">
					<Suspense>
						<StarmapCoreMenubar />
					</Suspense>
				</div>
				<div className="relative h-full overflow-hidden">
					<CanvasWrapper />
				</div>
				<div className="absolute bottom-0 left-4 flex items-end gap-2">
					<div className="w-96">
						<ZoomSliderComp />
					</div>
					<Suspense fallback={null}>
						<ShipControls />
					</Suspense>
				</div>
			</StarmapStoreProvider>
		</div>
	);
}

function ShipControls() {
	const useStarmapStore = useGetStarmapStore();
	const selectedObjectIds = useStarmapStore((store) => store.selectedObjectIds) as number[];

	const firstObject = selectedObjectIds[0];
	const [starmapShip] = q.starmapCore.ship.useNetRequest(
		{
			shipId: firstObject,
		},
		{ placeholderData: keepPreviousData },
	);

	const clickAction = useStarmapStore((store) => store.clickAction);
	return (
		<>
			{clickAction ? (
				<p className="pointer-events-none absolute bottom-16 w-full text-center">
					{clickAction.label}{" "}
					<Button
						onClick={() => useStarmapStore.setState({ clickAction: undefined })}
						className="btn-xs btn-error pointer-events-auto"
					>
						Cancel
					</Button>
				</p>
			) : null}
			{selectedObjectIds.length > 0 && starmapShip?.behavior ? (
				<>
					<Tooltip content="Patrol">
						<Button
							onClick={() =>
								q.starmapCore.setShipsBehavior.netSend({
									shipIds: selectedObjectIds,
									objective: "patrol",
								})
							}
							className={clsx("btn-sm btn-notice btn-outline", {
								"btn-active": starmapShip.behavior.objective === "patrol",
							})}
						>
							<Icon name="route" />
						</Button>
					</Tooltip>
					<Tooltip content="Hold Position">
						<Button
							onClick={() =>
								q.starmapCore.setShipsBehavior.netSend({
									shipIds: selectedObjectIds,
									objective: "hold",
								})
							}
							className={clsx("btn-sm btn-warning btn-outline", {
								"btn-active": starmapShip.behavior.objective === "hold",
							})}
						>
							<Icon name="hand" />
						</Button>
					</Tooltip>
					<Tooltip content="Attack">
						<Button
							onClick={() => {
								useStarmapStore.setState({
									clickAction: {
										label: "Choose a ship to attack.",
										action: (object) => {
											if (!object) {
												useStarmapStore.setState({ clickAction: undefined });
												return;
											}
											if (selectedObjectIds.includes(object)) return;

											q.starmapCore.setShipsBehavior.netSend({
												shipIds: selectedObjectIds,
												objective: "attack",
												targetId: object,
											});

											useStarmapStore.setState({ clickAction: undefined });
										},
									},
								});
							}}
							className={clsx("btn-sm btn-error btn-outline", {
								"btn-active": starmapShip.behavior.objective === "attack",
							})}
						>
							<Icon name="sword" />
						</Button>
					</Tooltip>
					<Tooltip content="Follow & Defend">
						<Button
							onClick={() =>
								q.starmapCore.setShipsBehavior.netSend({
									shipIds: selectedObjectIds,
									objective: "defend",
								})
							}
							className={clsx("btn-sm btn-primary btn-outline", {
								"btn-active": starmapShip.behavior.objective === "defend",
							})}
						>
							<Icon name="shield-half" />
						</Button>
					</Tooltip>
				</>
			) : null}
		</>
	);
}

function StarmapCoreMenubar() {
	const useStarmapStore = useGetStarmapStore();
	const [playerShips] = q.ship.players.useNetRequest();
	const [shipTemplates] = q.starmapCore.spawnSearch.useNetRequest({
		query: "",
	});
	const playerShip = playerShips[0];
	useEffect(() => {
		useStarmapStore.setState({
			followEntityId: playerShip.id,
			selectedObjectIds: [playerShip.id],
			currentSystem: playerShip.currentSystem,
		});
	}, [playerShip.id, playerShip.currentSystem, useStarmapStore]);
	const inSystem = useStarmapStore((store) => !!store.currentSystem);
	const selectedSpawn = useStarmapStore((store) => store.spawnShipTemplate);
	const selectedObjectIds = useStarmapStore((store) => store.selectedObjectIds);
	const followEntityId = useStarmapStore((store) => store.followEntityId);
	const planetsHidden = useStarmapStore((store) => store.planetsHidden);
	const sensorsHidden = useStarmapStore((store) => store.sensorsHidden);

	usePickStarmapShip();

	return (
		<>
			{inSystem && (
				<Button
					title="Return to Interstellar"
					className="btn-xs"
					onClick={() => useStarmapStore.getState().setCurrentSystem(null)}
				>
					<Icon name="arrow-left" />
				</Button>
			)}
			<Select
				label="Ship Template"
				labelHidden
				size="xs"
				placeholder="Ship Spawn Search..."
				buttonClassName="whitespace-nowrap"
				items={shipTemplates.map((s) => ({ id: s.id, label: s.name }))}
				selected={selectedSpawn?.id || null}
				setSelected={(value) =>
					useStarmapStore.setState({
						spawnShipTemplate: shipTemplates.find((s) => s.id === value) || null,
					})
				}
			></Select>

			<Button
				title="Follow selected entity"
				disabled={selectedObjectIds.length === 0}
				className={`btn-xs btn-primary ${
					selectedObjectIds.length === 0 ? "btn-disabled" : ""
				} ${followEntityId ? "" : "btn-outline"}`}
				onClick={() => {
					const firstSelected = selectedObjectIds[0];
					if (typeof firstSelected === "number") {
						useStarmapStore.setState((state) => ({
							followEntityId: state.followEntityId ? null : firstSelected,
						}));
					}
				}}
			>
				<Icon name="crosshair" />
			</Button>
			<Button
				title="Hide/Show Planets"
				className={`btn-xs btn-warning ${planetsHidden ? "" : "btn-outline"}`}
				onClick={() =>
					useStarmapStore.setState((state) => ({
						planetsHidden: !state.planetsHidden,
					}))
				}
			>
				{planetsHidden ? <Icon name="orbit" /> : <Icon name="circle-off" />}
			</Button>
			<Button
				title="Hide/Show Sensor Range"
				className={`btn-xs btn-info ${sensorsHidden ? "" : "btn-outline"}`}
				onClick={() =>
					useStarmapStore.setState((state) => ({
						sensorsHidden: !state.sensorsHidden,
					}))
				}
			>
				{sensorsHidden ? <Icon name="circle-dot" /> : <Icon name="circle-off" />}
			</Button>
			<YDimensionInput />
		</>
	);
}

function YDimensionInput() {
	const useStarmapStore = useGetStarmapStore();

	const yDimension = useStarmapStore((store) => store.yDimensionIndex);
	const [yDimensionState, setYDimensionState] = useState(yDimension.toString());

	useEffect(() => {
		setYDimensionState(yDimension.toString());
	}, [yDimension]);
	return (
		<Input
			className="input-xs"
			label="Y Dimension"
			title="Y Dimension"
			labelHidden
			placeholder="Y Dimension"
			type="text"
			inputMode="numeric"
			pattern="[0-9]*"
			value={yDimensionState}
			onBlur={() => {
				setYDimensionState(yDimension.toString());
			}}
			onChange={(e) => {
				setYDimensionState(e.target.value);
				if (!Number.isNaN(Number(e.target.value))) {
				}
				useStarmapStore.setState({
					yDimensionIndex: Number(e.target.value),
				});
			}}
		/>
	);
}

function StarmapCoreCanvasHooks() {
	useCancelFollow();
	useFollowEntity();
	useCalculateVerticalDistance();
	useSelectEntityEvent();

	return null;
}

function useSelectEntityEvent() {
	const useStarmapStore = useGetStarmapStore();

	useEventListener<SelectStarmapEntityEvent>(SelectStarmapEntityEvent.name, async (event) => {
		const starmapObject = await q.starmapCore.object.netRequest({
			objectId: event.entityId,
		});

		useStarmapStore.setState({ selectedObjectIds: [event.entityId] });
		if (starmapObject) {
			await useStarmapStore.getState().setCurrentSystem(starmapObject.position.parentId);
			useStarmapStore.getState().setCameraFocus(starmapObject.position);
		}
	});
}

const startPoint = new Vector3();
const endPoint = new Vector3();

function CanvasWrapper() {
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);
	q.starmapCore.stream.useDataStream({ systemId: currentSystem });
	const [starmapShips] = q.starmapCore.ships.useNetRequest(
		{
			systemId: currentSystem,
		},
		{ placeholderData: keepPreviousData },
	);
	const { interpolate } = useLiveQuery();

	const cameraRef = useRef<PerspectiveCamera>(undefined);

	const [dragRef, dragPosition] = useDragSelect<HTMLCanvasElement>({
		setSelectionBounds: ({ x1, x2, y1, y2 }) => {
			if (cameraRef.current) {
				const selectedObjectIds = get3dSelectedObjects(
					starmapShips.reduce((acc: { id: number; position: Coordinates<number> }[], ship) => {
						const position = interpolate(ship.id);
						if (position) {
							return acc.concat({ id: ship.id, position });
						}
						return acc;
					}, []),
					cameraRef.current,
					startPoint.set(x1 * 2 - 1, -(y1 * 2 - 1), 0.5),
					endPoint.set(x2 * 2 - 1, -(y2 * 2 - 1), 0.5),
				);
				useStarmapStore.setState({ selectedObjectIds });
			}
		},
		onDragStart: () => useStarmapStore.getState().setCameraControlsEnabled(false),
		onDragEnd: () => useStarmapStore.getState().setCameraControlsEnabled(true),
	});

	useEffect(() => {
		useStarmapStore.setState({ viewingMode: "core" });
	}, [useStarmapStore]);
	return (
		<>
			<StarmapCanvas
				onCreated={({ gl, camera }) => {
					dragRef(gl.domElement);
					cameraRef.current = camera as PerspectiveCamera;
				}}
				onPointerMissed={(event) => {
					if (event.button !== 2) {
						const clickAction = useStarmapStore.getState().clickAction;
						if (clickAction) {
							clickAction.action(null);
						}
						// Ignore Right click
						useStarmapStore.setState({ selectedObjectIds: [] });
					}
				}}
			>
				<Suspense>
					<StarmapCoreCanvasHooks />
				</Suspense>
				<ambientLight intensity={0.2} />
				<pointLight position={[10, 10, 10]} />
				{currentSystem === null ? (
					<InterstellarWrapper />
				) : (
					<ErrorBoundary fallback={null}>
						<SolarSystemWrapper />
					</ErrorBoundary>
				)}
			</StarmapCanvas>
			{dragPosition && <DragSelection {...dragPosition} />}
		</>
	);
}
export function InterstellarWrapper() {
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);
	const isViewscreen = useStarmapStore((store) => store.viewingMode);

	const [starmapShips] = q.starmapCore.ships.useNetRequest(
		{
			systemId: currentSystem,
		},
		{ placeholderData: keepPreviousData },
	);
	const [starmapSystems] = q.starmapCore.systems.useNetRequest();

	return (
		<InterstellarMap>
			{isViewscreen
				? null
				: starmapSystems.map((sys) =>
						sys.position && sys.identity ? (
							<SystemMarker
								key={sys.id}
								systemId={sys.id}
								commSatelliteRadius={null}
								position={
									[sys.position.x, sys.position.y, sys.position.z] as [number, number, number]
								}
								name={sys.identity.name}
								onClick={() => {
									useStarmapStore.setState({ selectedObjectIds: [sys.id] });

									if (sys.position) {
										useStarmapStore.getState().setCameraFocus(sys.position);
									}
								}}
								onDoubleClick={() => useStarmapStore.getState().setCurrentSystem(sys.id)}
							/>
						) : null,
					)}
			{starmapShips.map((ship) => (
				<Suspense key={ship.id} fallback={null}>
					<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
						<StarmapShip {...ship} />
					</ErrorBoundary>
				</Suspense>
			))}
		</InterstellarMap>
	);
}

const plane = new Plane();
const forward = new Vector3();
const center = new Vector3();
export function SolarSystemWrapper() {
	const { shipId } = useStation();
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);

	if (currentSystem === null) throw new Error("No current system");
	const [system] = q.starmapCore.system.useNetRequest({
		systemId: currentSystem,
	});
	const [starmapEntities] = q.starmapCore.entities.useNetRequest({
		systemId: currentSystem,
	});
	const [starmapShips] = q.starmapCore.ships.useNetRequest({
		systemId: currentSystem,
	});
	const [torpedos] = q.starmapCore.torpedos.useNetRequest({
		systemId: currentSystem,
	});

	const [waypoints] = q.waypoints.all.useNetRequest({
		shipId,
		active: true,
		systemId: "all",
	});
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });

	const selectedObjectIds = useStarmapStore((store) => store.selectedObjectIds);
	const planetsHidden = useStarmapStore((store) => store.planetsHidden);
	const isCore = useStarmapStore((store) => store.viewingMode === "core");
	const { interpolate } = useLiveQuery();
	const viewingMode = useStarmapStore((state) => state.viewingMode);

	const translate = useTranslate2DTo3D();
	const pointerMovement = useRef<Vector3 | null>(null);
	const entities = useMemo(
		() =>
			starmapEntities.flatMap((p) =>
				p.components.isPlanet && p.components.satellite
					? { id: p.id, satellite: p.components.satellite }
					: [],
			),
		[starmapEntities],
	);

	return (
		<SolarSystemMap skyboxKey={system?.components.isSolarSystem?.skyboxKey || "Blank"}>
			<ambientLight intensity={0.5} />
			{starmapEntities.map((entity) => {
				if (planetsHidden) return null;
				if (entity.components.isStar) {
					if (!entity.components.satellite) return null;
					return (
						<Suspense key={entity.id} fallback={null}>
							<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
								<StarEntity
									star={{
										id: entity.id,
										hue: entity.components.isStar.hue,
										isWhite: entity.components.isStar.isWhite,
										radius: entity.components.isStar.radius,
										satellite: entity.components.satellite,
									}}
								/>
							</ErrorBoundary>
						</Suspense>
					);
				}
				if (entity.components.isPlanet) {
					if (!entity.components.satellite) return null;

					return (
						<Suspense key={entity.id} fallback={null}>
							<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
								<Planet
									onClick={() => {
										const clickAction = useStarmapStore.getState().clickAction;
										if (clickAction) {
											clickAction.action(entity.id);
											return;
										}
										if (viewingMode === "viewscreen") return;
										let origin: Vector3 | undefined = undefined;
										const parent = entities?.find(
											(s) => s.id === entity.components.satellite?.parentId,
										)?.satellite;
										if (parent) origin = getOrbitPosition(parent);
										useStarmapStore
											.getState()
											.setCameraFocus(
												getOrbitPosition({ ...entity.components.satellite!, origin }),
											);
										useStarmapStore.setState({
											selectedObjectIds: [entity.id],
										});
									}}
									entities={entities}
									planet={{
										id: entity.id,
										satellite: entity.components.satellite,
										isPlanet: entity.components.isPlanet,
										name: entity.components.identity?.name || "",
									}}
								/>
							</ErrorBoundary>
						</Suspense>
					);
				}

				return null;
			})}
			{isCore
				? null
				: waypoints.map((waypoint) => (
						<WaypointEntity
							key={waypoint.id}
							waypoint={waypoint}
							viewscreen
							isLocked={waypoint.id === autopilot.destinationWaypointId}
							isFacing={waypoint.id === autopilot.facingWaypointIds[0]}
						/>
					))}
			{starmapShips.map((ship) => (
				<Suspense key={ship.id} fallback={null}>
					<ErrorBoundary FallbackComponent={() => <></>} onError={(err) => console.error(err)}>
						<StarmapShip
							{...ship}
							dragMovement={selectedObjectIds.includes(ship.id) ? pointerMovement : null}
							// TODO September 10, 2022 - This should use the faction color, or display the color scheme the flight director chooses
							spriteColor={selectedObjectIds.includes(ship.id) ? "#0088ff" : "white"}
							onClick={(event) => event.stopPropagation()}
							onPointerDown={(event) => {
								// Ignore right clicks so we can show the context menu
								if (event.button === 2) return;
								event.stopPropagation();
								const clickAction = useStarmapStore.getState().clickAction;
								if (clickAction) {
									clickAction.action(ship.id);
									return;
								}
								if (!selectedObjectIds.includes(ship.id)) {
									const position = interpolate(ship.id);
									if (position) {
										useStarmapStore.getState().setCameraFocus(position);
									}
									// TODO September 13, 2022 - Support shift/meta clicking to add or remove the ship from the selected objects list.
									useStarmapStore.setState({
										selectedObjectIds: [ship.id],
										followEntityId: ship.id,
									});
								}
								useStarmapStore.getState().setCameraControlsEnabled(false);

								pointerMovement.current = new Vector3();
								const abortController = new AbortController();

								document.addEventListener(
									"pointermove",
									(event) => {
										if (!pointerMovement.current) {
											pointerMovement.current = new Vector3();
										}

										const camera = useStarmapStore.getState().cameraControls?.current?.camera;
										const shipPosition = interpolate(ship.id);
										if (!shipPosition) return;
										if (camera) {
											center.set(shipPosition.x, shipPosition.y, shipPosition.z);
											camera.getWorldDirection(forward);
											plane.setFromNormalAndCoplanarPoint(forward, center);
										} else {
											plane.setComponents(1, 0, 0, 0);
										}

										const position3d = translate(event.clientX, event.clientY, plane);

										pointerMovement.current.subVectors(position3d, shipPosition);
									},
									{ signal: abortController.signal },
								);

								// TODO May 5 2025: Show a popover to confirm the movement a la DreamFlight Adventures
								document.addEventListener(
									"pointerup",
									() => {
										useStarmapStore.getState().setCameraControlsEnabled(true);
										abortController.abort();
										q.starmapCore.shipsSetPosition.netSend({
											ships: selectedObjectIds.flatMap((id) => {
												if (typeof id === "string" || !pointerMovement.current) return [];
												const shipPosition = interpolate(id);
												if (!shipPosition) return [];

												return {
													id,
													x: shipPosition.x + pointerMovement.current.x,
													y: shipPosition.y + pointerMovement.current.y,
													z: shipPosition.z + pointerMovement.current.z,
												};
											}),
										});
										pointerMovement.current = null;
									},
									{ once: true },
								);
							}}
						/>
					</ErrorBoundary>
				</Suspense>
			))}
			{torpedos.map(({ id, color, isDestroyed }) => (
				<Suspense key={id} fallback={null}>
					<Torpedo id={id} color={color} isDestroyed={isDestroyed} />
				</Suspense>
			))}

			<FiringPhasers systemId={currentSystem} />
		</SolarSystemMap>
	);
}

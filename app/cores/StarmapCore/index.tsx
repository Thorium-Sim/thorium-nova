import { keepPreviousData } from "@tanstack/react-query";
import {
	CoreLongRangeMessageDestinationEvent,
	CoreLongRangeMessagePickDestinationEvent,
	CoreLongRangeMessagePickSenderEvent,
	CoreLongRangeMessageSenderEvent,
} from "@thorium/cards/LongRangeComm/events";
import { ZoomSliderComp } from "@thorium/cards/Navigation/MapControls";
import { WaypointEntity } from "@thorium/cards/Pilot/Waypoint";
import { InterstellarMap } from "@thorium/components/Starmap/InterstellarMap";
import { Planet } from "@thorium/components/Starmap/Planet";
import { SolarSystemMap } from "@thorium/components/Starmap/SolarSystemMap";
import StarEntity from "@thorium/components/Starmap/Star";
import StarmapCanvas from "@thorium/components/Starmap/StarmapCanvas";
import { StarmapShip } from "@thorium/components/Starmap/StarmapShip";
import SystemMarker from "@thorium/components/Starmap/SystemMarker";
import {
	StarmapStoreProvider,
	useCalculateVerticalDistance,
	useGetStarmapStore,
} from "@thorium/components/Starmap/starmapStore";
import { Torpedo } from "@thorium/components/Starmap/Torpedo";
import { useCancelFollow } from "@thorium/components/Starmap/useCancelFollow";
import { useFollowEntity } from "@thorium/components/Starmap/useFollowEntity";
import { q } from "@thorium/context/AppContext";
import useDragSelect, {
	DragSelection,
	get3dSelectedObjects,
} from "@thorium/hooks/useDragSelect";
import useEventListener from "@thorium/hooks/useEventListener";
import { useLocalStorage } from "@thorium/hooks/useLocalStorage";
import { useTranslate2DTo3D } from "@thorium/hooks/useTranslate2DTo3D";
import { useActiveCores } from "@thorium/routes/core/CoreFlexLayout";
import { useStation } from "@thorium/routes/station/useStation";
import { usePrompt } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import Input from "@thorium/ui/Input";
import SearchableInput, {
	DefaultResultLabel,
} from "@thorium/ui/SearchableInput";
import { Tooltip } from "@thorium/ui/Tooltip";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import type { Coordinates } from "@thorium/utils/unitTypes";
import clsx from "clsx";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
	Disclosure,
	DisclosurePanel,
	Heading,
	Button as RAButton,
} from "react-aria-components";
import { flushSync } from "react-dom";
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
		<div className="h-[calc(100%-2rem)] relative" ref={ref}>
			<StarmapStoreProvider>
				<StarmapCoreContextMenu parentRef={ref} />
				<div className="border-b border-b-white/20 pb-0.5 px-2 flex gap-2 items-baseline">
					<Suspense>
						<StarmapCoreMenubar />
					</Suspense>
				</div>
				<div className="h-full relative overflow-hidden">
					<CanvasWrapper />
					<Suspense>
						<EditorPalette />
					</Suspense>
				</div>
				<div className="absolute left-4 bottom-0 flex gap-2 items-end">
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

function EditorPalette() {
	const useStarmapStore = useGetStarmapStore();
	const selectedObjectIds = useStarmapStore(
		(store) => store.selectedObjectIds,
	) as number[];

	const firstObject = selectedObjectIds[0];

	return (
		<div
			key={firstObject}
			className={cn(
				"bg-gray-800 h-full max-w-96 w-2/5 absolute top-0 right-0 shadow-lg transition-transform px-2 py-2 overflow-y-auto",
				{
					"translate-x-0": selectedObjectIds.length > 0,
					"translate-x-full": selectedObjectIds.length === 0,
				},
			)}
		>
			<EditorProperties id={firstObject} />
		</div>
	);
}

function EditorProperties({ id }: { id: number }) {
	const { shipId } = useStation();
	const [starmapObject] = q.starmapCore.object.useNetRequest(
		{
			objectId: id,
		},
		{
			placeholderData: keepPreviousData,
		},
	);

	const currentAlertLevel = starmapObject?.components.isShip?.alertLevel || "5";
	return (
		<>
			{starmapObject?.components.identity ? (
				<Input
					label="Name"
					className="input-xs"
					defaultValue={starmapObject?.components.identity?.name}
				/>
			) : null}
			{starmapObject?.components.isShip ? (
				<EditorDisclosure title="Ship">
					<Input
						label="Class"
						className="input-xs"
						defaultValue={starmapObject?.components.isShip.shipClass}
					/>

					<Input
						label="Registry"
						className="input-xs"
						defaultValue={starmapObject?.components.isShip.registry}
					/>
					<span>Alert Level</span>
					<div className="flex gap-1">
						<AlertLevelButton
							alertLevel="1"
							color="bg-error"
							currentLevel={currentAlertLevel}
							shipId={id}
						/>
						<AlertLevelButton
							alertLevel="2"
							color="bg-warning"
							currentLevel={currentAlertLevel}
							shipId={id}
						/>
						<AlertLevelButton
							alertLevel="3"
							color="bg-yellow-600"
							currentLevel={currentAlertLevel}
							shipId={id}
						/>
						<AlertLevelButton
							alertLevel="4"
							color="bg-lime-600"
							currentLevel={currentAlertLevel}
							shipId={id}
						/>
						<AlertLevelButton
							alertLevel="5"
							color="bg-green-600"
							currentLevel={currentAlertLevel}
							shipId={id}
						/>
					</div>
					<Input
						label="Category"
						className="input-xs"
						defaultValue={starmapObject?.components.isShip.category}
					/>
				</EditorDisclosure>
			) : null}
			{starmapObject?.components.reputation ? (
				<EditorDisclosure title="Reputation">
					<Suspense>
						<ReputationEditor id={id} />
					</Suspense>
				</EditorDisclosure>
			) : null}
			{starmapObject?.id !== shipId ? (
				<EditorDisclosure title="Long Range Comm">
					<LongRangeCommEditor
						id={id}
						name={starmapObject?.components.identity?.name || ""}
					/>
				</EditorDisclosure>
			) : null}
		</>
	);
}

function AlertLevelButton({
	color,
	currentLevel,
	alertLevel,
	shipId,
}: {
	color: string;
	currentLevel: "1" | "2" | "3" | "5" | "4" | "p";
	alertLevel: "1" | "2" | "3" | "5" | "4" | "p";
	shipId: number;
}) {
	return (
		<button
			className={cn("aspect-square w-6 rounded brightness-75", color, {
				"brightness-125": currentLevel === alertLevel,
			})}
			onClick={() => {
				q.alertLevel.update.netSend({
					shipId,
					alertLevel,
				});
			}}
		>
			{alertLevel}
		</button>
	);
}

function ReputationEditor({ id }: { id: number }) {
	const [reputation] = q.starmapCore.reputation.useNetRequest({ entityId: id });
	const useStarmapStore = useGetStarmapStore();
	const prompt = usePrompt();
	return (
		<div className="px-2 mt-1">
			{reputation.length === 0 ? (
				<p>No reputation</p>
			) : (
				reputation.map(({ id: targetId, name, value }) => {
					return (
						<div key={name} className="flex">
							<label className="flex-1" htmlFor={`reputation-${targetId}`}>
								{name}
							</label>
							<input
								id={`reputation-${targetId}`}
								className="input input-xs w-24"
								value={value}
							/>
							<Button
								className="btn-xs btn-warning"
								onClick={async () => {
									const stringValue = await prompt({
										header: "Set Reputation",
										body: "Enter the reputation value. 0 is neutral, positive is favorable, negative is unfavorable",
										defaultValue: value.toString(),
									});
									if (stringValue === null) return;
									const newValue = Number(stringValue);
									if (Number.isNaN(newValue)) {
										return;
									}
									q.starmapCore.setReputation.netSend({
										entityId: id,
										targetId,
										value: newValue,
									});
								}}
							>
								<Icon name="pencil" />
							</Button>
						</div>
					);
				})
			)}
			<div className="flex gap-1 justify-between mt-1">
				<Button
					className="flex-1 btn-xs btn-primary"
					onClick={() =>
						useStarmapStore.setState({
							clickAction: {
								label: "Choose a ship or faction to become friends with.",
								action: (object) => {
									if (!object) {
										useStarmapStore.setState({ clickAction: undefined });
										return;
									}
									if (object === id) return;
									q.starmapCore.setReputation.netSend({
										entityId: id,
										targetId: object,
										value: 1000,
									});
									useStarmapStore.setState({ clickAction: undefined });
								},
							},
						})
					}
				>
					Friend
				</Button>
				<Button
					className="flex-1 btn-xs btn-error"
					onClick={() =>
						useStarmapStore.setState({
							clickAction: {
								label: "Choose a ship or faction to become enemies with.",
								action: (object) => {
									if (!object) {
										useStarmapStore.setState({ clickAction: undefined });
										return;
									}
									if (object === id) return;
									q.starmapCore.setReputation.netSend({
										entityId: id,
										targetId: object,
										value: -1000,
									});
									useStarmapStore.setState({ clickAction: undefined });
								},
							},
						})
					}
				>
					Enemy
				</Button>
				<Button
					className="flex-1 btn-xs btn-info"
					onClick={() =>
						useStarmapStore.setState({
							clickAction: {
								label:
									"Choose a ship or faction to set a reputation value with.",
								action: async (object) => {
									if (!object) {
										useStarmapStore.setState({ clickAction: undefined });
										return;
									}
									if (object === id) return;
									const stringValue = await prompt({
										header: "Set Reputation",
										body: "Enter the reputation value. 0 is neutral, positive is favorable, negative is unfavorable",
										defaultValue: "0",
									});
									if (stringValue === null) return;
									const value = Number(stringValue);
									if (Number.isNaN(value)) {
										return;
									}
									q.starmapCore.setReputation.netSend({
										entityId: id,
										targetId: object,
										value,
									});
									useStarmapStore.setState({ clickAction: undefined });
								},
							},
						})
					}
				>
					Pick
				</Button>
			</div>
		</div>
	);
}
function LongRangeCommEditor({ id, name }: { id: number; name: string }) {
	const { shipId } = useStation();
	const activeCores = useActiveCores();
	const [addressBook] = q.longRangeComm.addressBook.useNetRequest({ shipId });
	const prompt = usePrompt();
	const longRangeComposerComponent = activeCores.find(
		(c) => c.component === "LongRangeCommComposerCore",
	);

	return (
		<div className="mt-2 flex flex-wrap gap-1">
			{!addressBook.some((a) => a.id === id) ? (
				<Button
					className="btn-info btn-xs flex-auto"
					onClick={async () => {
						const contactName = await prompt({
							header:
								"What is the name shown for this contact in the address book?",
							defaultValue: name,
						});
						await q.longRangeComm.addToAddressBook.netSend({
							shipId,
							contactId: id,
							name: contactName,
						});
					}}
				>
					Add to Address Book
				</Button>
			) : null}
			{longRangeComposerComponent ? (
				<>
					<Button
						title="Send Long Range Message"
						className="btn-success btn-xs flex-auto"
						onClick={() => {
							flushSync(() => {
								longRangeComposerComponent.activate();
							});
							window.dispatchEvent(new CoreLongRangeMessageSenderEvent(id));
						}}
					>
						Send LRM From Entity
					</Button>
					<Button
						title="Send Long Range Message"
						className="btn-success btn-xs flex-auto"
						onClick={() => {
							flushSync(() => {
								longRangeComposerComponent.activate();
							});
							window.dispatchEvent(
								new CoreLongRangeMessageDestinationEvent(id),
							);
						}}
					>
						Send LRM To Entity
					</Button>
				</>
			) : null}
		</div>
	);
}

function usePickLongRangeComm() {
	const useStarmapStore = useGetStarmapStore();
	useEventListener(CoreLongRangeMessagePickSenderEvent.name, () => {
		useStarmapStore.setState({
			clickAction: {
				label: "Choose a ship to send the long range message.",
				action: (object) => {
					if (!object) {
						useStarmapStore.setState({ clickAction: undefined });
						return;
					}

					window.dispatchEvent(new CoreLongRangeMessageSenderEvent(object));

					useStarmapStore.setState({ clickAction: undefined });
				},
			},
		});
	});
	useEventListener(CoreLongRangeMessagePickDestinationEvent.name, () => {
		useStarmapStore.setState({
			clickAction: {
				label: "Choose a ship to receive the long range message.",
				action: (object) => {
					if (!object) {
						useStarmapStore.setState({ clickAction: undefined });
						return;
					}

					window.dispatchEvent(
						new CoreLongRangeMessageDestinationEvent(object),
					);

					useStarmapStore.setState({ clickAction: undefined });
				},
			},
		});
	});
}

export function EditorDisclosure({
	title,
	children,
	defaultOpen = false,
}: {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const [isDefaultOpen] = useLocalStorage(
		`core-editor-open-${title}`,
		defaultOpen,
	);
	const disclosureRef = useRef<HTMLDivElement>(null);
	return (
		<Disclosure defaultExpanded={isDefaultOpen}>
			{({ isExpanded }) => (
				<>
					<HandleIsOpen
						open={isExpanded}
						title={title}
						scrollRef={disclosureRef}
					/>
					<Heading className="w-full sticky -top-1" ref={disclosureRef}>
						<RAButton
							slot="trigger"
							className="btn btn-xs justify-between btn-block"
						>
							<span>{title}</span>
							<Icon
								name="chevron-up"
								className={` transition-transform${
									isExpanded ? "transform rotate-180" : ""
								} w-5 h-5`}
							/>
						</RAButton>
					</Heading>
					<DisclosurePanel
						className={cn(
							"pb-2 px-2",
							"relative scale-100 ease-out",
							"data-[closed]:opacity-0 data-[closed]:scale-95",
							"data-[enter]:duration-100",
							"data-[leave]:duration-75",
						)}
					>
						<Suspense>{children}</Suspense>
					</DisclosurePanel>
				</>
			)}
		</Disclosure>
	);
}
const HandleIsOpen = ({
	open,
	title,
	scrollRef,
}: {
	title: string;
	open: boolean;
	scrollRef: React.RefObject<HTMLDivElement | null>;
}) => {
	const hasMounted = useRef(false);
	useEffect(() => {
		localStorage.setItem(`core-editor-open-${title}`, JSON.stringify(open));
	}, [title, open]);
	useLayoutEffect(() => {
		if (open && hasMounted.current) {
			setTimeout(() => {
				scrollRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
		}
		hasMounted.current = true;
	}, [open, scrollRef]);

	return null;
};

function ShipControls() {
	const useStarmapStore = useGetStarmapStore();
	const selectedObjectIds = useStarmapStore(
		(store) => store.selectedObjectIds,
	) as number[];

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
				<p className="absolute bottom-16 text-center pointer-events-none w-full">
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

	usePickLongRangeComm();

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
			<SearchableInput<{
				id: string;
				pluginName: string;
				name: string;
				category: string;
				vanity: string;
			}>
				inputClassName="input-xs"
				queryKey="spawn"
				getOptions={async ({ queryKey, signal }) => {
					const result = await q.starmapCore.spawnSearch.netRequest(
						{ query: queryKey[1] },
						{ signal },
					);
					return result;
				}}
				ResultLabel={({ active, result, selected }) => (
					<DefaultResultLabel active={active} selected={selected}>
						<div className="flex gap-4">
							<img src={result.vanity} alt="" className="w-8 h-8" />
							<div>
								<p className="m-0 leading-none">{result.name}</p>
								<p className="m-0 leading-none">
									<small>{result.category}</small>
								</p>
							</div>
						</div>
					</DefaultResultLabel>
				)}
				setSelected={(item) =>
					useStarmapStore.setState({ spawnShipTemplate: item })
				}
				selected={selectedSpawn}
				placeholder="Ship Spawn Search..."
			/>
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
				{sensorsHidden ? (
					<Icon name="circle-dot" />
				) : (
					<Icon name="circle-off" />
				)}
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
			onBlur={(e) => {
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

const vec = new Vector3();
const vec2 = new Vector3();
function StarmapCoreCanvasHooks() {
	useCancelFollow();
	useFollowEntity();
	useCalculateVerticalDistance();
	useSelectEntityEvent();

	return null;
}

function useSelectEntityEvent() {
	const useStarmapStore = useGetStarmapStore();

	useEventListener<SelectStarmapEntityEvent>(
		SelectStarmapEntityEvent.name,
		async (event) => {
			const starmapObject = await q.starmapCore.object.netRequest({
				objectId: event.entityId,
			});

			useStarmapStore.setState({ selectedObjectIds: [event.entityId] });
			if (starmapObject) {
				await useStarmapStore
					.getState()
					.setCurrentSystem(starmapObject.position.parentId);
				useStarmapStore.getState().setCameraFocus(starmapObject.position);
			}
		},
	);
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

	const [dragRef, dragPosition, node] = useDragSelect<HTMLCanvasElement>({
		setSelectionBounds: ({ x1, x2, y1, y2 }) => {
			if (cameraRef.current) {
				const selectedObjectIds = get3dSelectedObjects(
					starmapShips.reduce(
						(acc: { id: number; position: Coordinates<number> }[], ship) => {
							const position = interpolate(ship.id);
							if (position) {
								return acc.concat({ id: ship.id, position });
							}
							return acc;
						},
						[],
					),
					cameraRef.current,
					startPoint.set(x1 * 2 - 1, -(y1 * 2 - 1), 0.5),
					endPoint.set(x2 * 2 - 1, -(y2 * 2 - 1), 0.5),
				);
				useStarmapStore.setState({ selectedObjectIds });
			}
		},
		onDragStart: () =>
			useStarmapStore.getState().setCameraControlsEnabled(false),
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
									[sys.position.x, sys.position.y, sys.position.z] as [
										number,
										number,
										number,
									]
								}
								name={sys.identity.name}
								onClick={() => {
									useStarmapStore.setState({ selectedObjectIds: [sys.id] });

									if (sys.position) {
										useStarmapStore.getState().setCameraFocus(sys.position);
									}
								}}
								onDoubleClick={() =>
									useStarmapStore.getState().setCurrentSystem(sys.id)
								}
							/>
						) : null,
					)}
			{starmapShips.map((ship) => (
				<Suspense key={ship.id} fallback={null}>
					<ErrorBoundary
						FallbackComponent={() => <></>}
						onError={(err) => console.error(err)}
					>
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
	return (
		<SolarSystemMap
			skyboxKey={system?.components.isSolarSystem?.skyboxKey || "Blank"}
		>
			<ambientLight intensity={0.5} />
			{starmapEntities.map((entity) => {
				if (planetsHidden) return null;
				if (entity.components.isStar) {
					if (!entity.components.satellite) return null;
					return (
						<Suspense key={entity.id} fallback={null}>
							<ErrorBoundary
								FallbackComponent={() => <></>}
								onError={(err) => console.error(err)}
							>
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
							<ErrorBoundary
								FallbackComponent={() => <></>}
								onError={(err) => console.error(err)}
							>
								<Planet
									onClick={() => {
										const clickAction = useStarmapStore.getState().clickAction;
										if (clickAction) {
											clickAction.action(entity.id);
											return;
										}
										if (viewingMode === "viewscreen") return;
										useStarmapStore
											.getState()
											.setCameraFocus(
												getOrbitPosition(entity.components.satellite!),
											);
										useStarmapStore.setState({
											selectedObjectIds: [entity.id],
										});
									}}
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
					<ErrorBoundary
						FallbackComponent={() => <></>}
						onError={(err) => console.error(err)}
					>
						<StarmapShip
							{...ship}
							dragMovement={
								selectedObjectIds.includes(ship.id) ? pointerMovement : null
							}
							// TODO September 10, 2022 - This should use the faction color, or display the color scheme the flight director chooses
							spriteColor={
								selectedObjectIds.includes(ship.id) ? "#0088ff" : "white"
							}
							onClick={(event) => event.stopPropagation()}
							onPointerDown={(event) => {
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

										const camera =
											useStarmapStore.getState().cameraControls?.current
												?.camera;
										const shipPosition = interpolate(ship.id);
										if (!shipPosition) return;
										if (camera) {
											center.set(
												shipPosition.x,
												shipPosition.y,
												shipPosition.z,
											);
											camera.getWorldDirection(forward);
											plane.setFromNormalAndCoplanarPoint(forward, center);
										} else {
											plane.setComponents(1, 0, 0, 0);
										}

										const position3d = translate(
											event.clientX,
											event.clientY,
											plane,
										);

										pointerMovement.current.subVectors(
											position3d,
											shipPosition,
										);
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
												if (typeof id === "string" || !pointerMovement.current)
													return [];
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

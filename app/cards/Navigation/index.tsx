import type { CardProps } from "@thorium/cards/CardProps";
import StarmapCanvas from "@thorium/components/Starmap/StarmapCanvas";
import {
	StarmapStoreProvider,
	useCalculateVerticalDistance,
	useGetStarmapStore,
} from "@thorium/components/Starmap/starmapStore";
import { useCancelFollow } from "@thorium/components/Starmap/useCancelFollow";
import { useFollowEntity } from "@thorium/components/Starmap/useFollowEntity";
import { q, clientId } from "@thorium/context/AppContext";
import { toast } from "@thorium/context/ToastContext";
import { useStation } from "@thorium/routes/station/useStation";
import { useConfirm } from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import { Icon } from "@thorium/ui/Icon";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import SearchableInput, { DefaultResultLabel } from "@thorium/ui/SearchableInput";
import SearchableList from "@thorium/ui/SearchableList";
import { getThemeButtonBorderColor } from "@thorium/utils/processThemeColor";
import { capitalCase } from "change-case";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Switch } from "react-aria-components";

import { InterstellarWrapper } from "./InterstellarWrapper";
import { MapControls } from "./MapControls";
import { ObjectDetails } from "./ObjectDetails";
import { SolarSystemWrapper } from "./SolarSystemWrapper";
export function Navigation(props: CardProps) {
	const { shipId } = useStation();
	q.navigation.stream.useDataStream({ shipId });

	return (
		<StarmapStoreProvider>
			<div className="navigation-card relative mx-auto h-full border border-white/50 bg-black/70">
				<Suspense fallback={<LoadingSpinner />}>
					<CanvasWrapper shouldRender={props.cardLoaded} />
				</Suspense>
				<div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-2 p-4">
					<div className="navigation-search max-w-sm">
						<StarmapSearch />
					</div>
					<div className="navigation-object max-h-min w-96 self-start justify-self-end">
						<Suspense fallback={null}>
							<ObjectDetails />
							<div className="mt-2 flex w-full gap-4">
								<AddWaypoint />
								<EnterSystem />
							</div>
						</Suspense>
					</div>
					<MapControls />
					<Suspense fallback={null}>
						<Waypoints />
					</Suspense>
				</div>
			</div>
		</StarmapStoreProvider>
	);
}

function useWaypointColors() {
	return useMemo(() => {
		const primary = getThemeButtonBorderColor("btn-primary", "#65abc4");
		const warning = getThemeButtonBorderColor("btn-warning", "#c7935e");
		const notice = getThemeButtonBorderColor("btn-notice", "#935dc9");
		return { primary, warning, notice };
	}, []);
}

function Waypoints() {
	const { shipId } = useStation();
	const confirm = useConfirm();
	const useStarmapStore = useGetStarmapStore();
	const ref = useRef<HTMLDivElement>(null);
	const colors = useWaypointColors();

	const [waypoints] = q.waypoints.all.useNetRequest({
		systemId: "all",
		shipId,
		active: false,
	});
	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });
	const nearestFacingId = autopilot.facingWaypointIds[0] ?? null;
	const lockedWaypointId = autopilot.destinationWaypointId;

	return (
		<div className="waypoints-container pointer-events-auto w-96 self-end justify-self-end">
			<div className="mt-2 w-full overflow-hidden">
				<div ref={ref} className="flex h-full max-h-72 flex-col">
					<SearchableList
						showSearchLabel={false}
						searchPlaceholder="Search Waypoint History..."
						items={
							waypoints.length === 0
								? [
										{
											id: -1,
											label: "No waypoints set.",
											isActive: false,
											isFacingOrLocked: false,
											isLocked: false,
										},
									]
								: waypoints
										.map((w) => ({
											id: w.id,
											label: w.name,
											isActive: w.isActive,
											isFacingOrLocked: w.id === nearestFacingId || w.id === lockedWaypointId,
											isLocked: w.id === lockedWaypointId,
										}))
										.sort((a, b) => (a.isLocked === b.isLocked ? 0 : a.isLocked ? -1 : 1))
						}
						renderItem={({ id, label, isActive, isFacingOrLocked, isLocked }) => (
							<span className="flex items-center">
								<span className="flex-1 text-white">{label}</span>
								{id > -1 && !isLocked && (
									<>
										<Switch
											isSelected={isActive}
											onChange={async (selected) => {
												if (selected) {
													await q.waypoints.activate.netSend({ waypointId: id });
												} else {
													await q.waypoints.deactivate.netSend({ waypointId: id });
												}
											}}
											className="group waypoints-activate-switch mr-2 flex items-center"
										>
											<div
												className="flex h-4 w-7 items-center rounded-full border transition"
												style={{
													borderColor: isFacingOrLocked
														? colors.primary
														: isActive
															? colors.warning
															: colors.notice,
													backgroundColor: `${isFacingOrLocked ? colors.primary : isActive ? colors.warning : colors.notice}4d`,
												}}
											>
												<span
													className={`ml-0.5 block h-3 w-3 rounded-full bg-white transition-all ${
														isFacingOrLocked ? "ml-3" : "group-data-[selected]:ml-3"
													}`}
												/>
											</div>
										</Switch>
										<button
											className="flex appearance-none items-center"
											onClick={async (e) => {
												e.preventDefault();
												e.stopPropagation();
												try {
													await q.waypoints.delete.netSend({
														waypointId: id,
														shipId,
													});
												} catch (err) {
													if (err instanceof Error) {
														toast({ color: "error", title: err.message });
													}
												}
											}}
										>
											<Icon
												name="ban"
												className="text-white drop-shadow-[0_0_2px_white] drop-shadow-[0_0_4px_white]"
											/>
										</button>
									</>
								)}
							</span>
						)}
						getItemStyle={({ isActive, isFacingOrLocked }) => {
							const color = isFacingOrLocked
								? colors.primary
								: isActive
									? colors.warning
									: colors.notice;
							return {
								borderColor: color,
								background: `${color}4d`,
								boxShadow: `inset 0px 0px 20px -5px ${color}80`,
							};
						}}
						setSelectedItem={async ({ id }) => {
							const waypoint = waypoints.find((w) => w.id === id);
							if (waypoint) {
								if (useStarmapStore.getState().currentSystem !== waypoint?.position.parentId) {
									await useStarmapStore.getState().setCurrentSystem(waypoint?.position.parentId);
								}
								useStarmapStore.setState({
									selectedObjectIds: waypoint.objectId ? [waypoint.objectId] : [],
								});
								const controls = useStarmapStore.getState().cameraControls;
								controls?.current?.moveTo(
									waypoint.position.x,
									waypoint.position.y,
									waypoint.position.z,
									true,
								);
							}
						}}
					/>
				</div>
			</div>
			{waypoints.length > 0 && (
				<div className="mt-2 flex gap-2">
					<Button
						className="btn-error flex-1"
						onClick={async () => {
							const result = await confirm({
								header: "All active and inactive waypoints will be cleared. Proceed?",
							});
							if (result) {
								q.waypoints.deleteAll.netSend({ shipId });
							}
						}}
					>
						Clear All
					</Button>
					<Button
						className="btn-warning flex-1"
						onClick={() => q.waypoints.deactivateAll.netSend({ shipId })}
					>
						Deactivate All
					</Button>
				</div>
			)}
		</div>
	);
}

function AddWaypoint() {
	const { shipId } = useStation();

	const useStarmapStore = useGetStarmapStore();
	const selectedObjectIds = useStarmapStore((store) => store.selectedObjectIds);

	const [waypoints] = q.waypoints.all.useNetRequest({
		systemId: "all",
		shipId,
		active: false,
	});

	const [autopilot] = q.pilot.autopilot.get.useNetRequest({ shipId });

	const existingWaypoint = waypoints.find(
		(w) => w.id === selectedObjectIds[0] || w.objectId === selectedObjectIds[0],
	);
	const isLocked = existingWaypoint?.id === autopilot.destinationWaypointId;

	if (!selectedObjectIds[0]) return null;

	if (isLocked) {
		return (
			<Button className="btn-primary pointer-events-auto flex-1" disabled>
				Waypoint Locked
			</Button>
		);
	}

	if (existingWaypoint?.isActive) {
		return (
			<Button
				className="btn-notice deactivate-waypoint-button pointer-events-auto flex-1"
				onClick={() => q.waypoints.deactivate.netSend({ waypointId: existingWaypoint.id })}
			>
				Deactivate Waypoint
			</Button>
		);
	}

	if (existingWaypoint) {
		return (
			<Button
				className="btn-warning activate-waypoint-button pointer-events-auto flex-1"
				onClick={() => q.waypoints.activate.netSend({ waypointId: existingWaypoint.id })}
			>
				Activate Waypoint
			</Button>
		);
	}

	return (
		<Button
			className="btn-primary pointer-events-auto flex-1"
			disabled={selectedObjectIds.length === 0}
			onClick={async () => {
				try {
					if (typeof selectedObjectIds[0] === "number")
						await q.waypoints.spawn.netSend({
							entityId: selectedObjectIds[0],
							shipId,
							active: false,
						});
				} catch (error: unknown) {
					if (error instanceof Error) {
						toast({ title: error.message, color: "error" });
					}
				}
			}}
		>
			Create Waypoint
		</Button>
	);
}

function EnterSystem() {
	const { shipId } = useStation();

	const useStarmapStore = useGetStarmapStore();
	const [id] = useStarmapStore((store) => store.selectedObjectIds);
	const [requestData] = q.navigation.object.useNetRequest({
		objectId: Number(id) || undefined,
		shipId,
	});
	const object = requestData.object;
	if (!object) return null;
	if (object.type !== "solarSystem") return null;

	return (
		<Button
			className={`btn-warning pointer-events-auto flex-1 ${!id ? "btn-disabled" : ""}`}
			disabled={!id}
			onClick={async () => {
				if (typeof id === "number") {
					useStarmapStore.getState().setCurrentSystem(id);
				}
				useStarmapStore.setState({ selectedObjectIds: [] });
			}}
		>
			Enter System
		</Button>
	);
}

function StarmapSearch() {
	const useStarmapStore = useGetStarmapStore();
	return (
		<SearchableInput<{ id: number; name: string; type: string; position: any }>
			queryKey="nav"
			getOptions={async ({ queryKey, signal }) => {
				const result = await q.navigation.search.netRequest({ query: queryKey[1] }, { signal });
				return result;
			}}
			ResultLabel={({ active, result, selected }) => (
				<DefaultResultLabel active={active} selected={selected}>
					<p>{result.name}</p>
					<p>
						<small>{result.type === "solar" ? "Solar System" : capitalCase(result.type)}</small>
					</p>
				</DefaultResultLabel>
			)}
			selected={null}
			setSelected={async (item) => {
				if (!item) return;
				if (useStarmapStore.getState().currentSystem !== item?.position.parentId) {
					await useStarmapStore.getState().setCurrentSystem(item?.position.parentId);
				}
				useStarmapStore.setState({ selectedObjectIds: [item.id] });
				const controls = useStarmapStore.getState().cameraControls;
				controls?.current?.moveTo(item.position.x, item.position.y, item.position.z, false);
				q.thorium.genericEvent.netSend({
					clientId,
					eventName: "starmap-selected",
					properties: `${item.id}`,
				});
			}}
			placeholder="Search Navigational Records..."
			displayValue={(item) => item?.name}
		/>
	);
}

function CanvasWrapper({ shouldRender }: { shouldRender: boolean }) {
	const useStarmapStore = useGetStarmapStore();
	const currentSystem = useStarmapStore((store) => store.currentSystem);
	const [firstRender, setFirstRender] = useState(true);

	useEffect(() => {
		useStarmapStore.setState({ viewingMode: "station", cameraView: "2d" });
		setFirstRender(false);
	}, [useStarmapStore]);

	return (
		<StarmapCanvas shouldRender={firstRender || shouldRender}>
			<ambientLight intensity={0.2} />
			<pointLight position={[10, 10, 10]} />
			<Suspense>
				<StarmapHooks />
			</Suspense>
			{currentSystem === null ? <InterstellarWrapper /> : <SolarSystemWrapper />}
		</StarmapCanvas>
	);
}

function StarmapHooks() {
	useCancelFollow();
	useFollowEntity();
	useCalculateVerticalDistance();
	return null;
}

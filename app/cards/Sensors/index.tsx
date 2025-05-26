import type { CardProps } from "@thorium/cards/CardProps";
import {
	CircleGrid,
	CircleGridTiltButton,
	GridCanvas,
} from "@thorium/cards/Pilot/CircleGrid";
import { CircleGridContacts } from "@thorium/cards/Pilot/PilotContacts";
import { PilotZoomSlider } from "@thorium/cards/Pilot/PilotZoomSlider";
import { CircleGridStoreProvider } from "@thorium/cards/Pilot/useCircleGridStore";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { clientId, q } from "@thorium/context/AppContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { Suspense, useEffect, useRef, useState } from "react";
import { DistanceCircle } from "@thorium/cards/Pilot/DistanceCircle";
import type { scanTypes } from "@thorium/utils/flags/scanTypes";
import { capitalCase } from "change-case";
import {
	Button,
	Disclosure,
	DisclosureGroup,
	DisclosurePanel,
} from "react-aria-components";
import type { z } from "zod";
import { Icon } from "@thorium/ui/Icon";
import { useStation } from "@thorium/routes/station/useStation";
import {
	ScanComponents,
	ScanResults,
} from "@thorium/cards/Sensors/ScanComponents";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { useQueryClient } from "@tanstack/react-query";

/**
 * TODO:
 * - Passive sensors data for objects - maybe visual overlays next to the blob
 * 		- Heat signature (just temperature)
 * 		- When an object performs an active scan
 *   	- When an object has an active communication
 *		- Size (probably just length)
 *		- Shields raised or lowered
 *		- Transporters
 * - Configure a scan to re-run
 * - Change "Damage" to "Systems", provide a list of systems on the ship
 *    (prerequisite for systems-based targeting). Systems-based targeting works by adjusting the frequency of the phasers, maybe?
 */
export function Sensors({ cardLoaded }: CardProps) {
	const { shipId } = useStation();
	const [{ activeRange, passiveRange }] = q.sensors.get.useNetRequest({
		shipId,
	});
	const [selected, setSelected] = useState<number | null>(null);
	const [occludedContacts, setOccludedContacts] = useState<number[]>([]);
	const clickRef = useRef(false);

	return (
		<CircleGridStoreProvider zoomMax={passiveRange}>
			<div className="grid grid-cols-4 grid-rows-[100%] h-full place-content-center gap-4">
				<div className="flex flex-col justify-between">
					<Suspense>
						<SensorsShipList
							selectedId={selected}
							setSelected={setSelected}
							occludedContacts={occludedContacts}
						/>
					</Suspense>
					<div>
						<PilotZoomSlider />
						<CircleGridTiltButton />
					</div>
				</div>
				<div className="col-span-2 max-w-full max-h-full w-full justify-self-center aspect-square self-center">
					<Suspense fallback={null}>
						<GridCanvas
							shouldRender={cardLoaded}
							onBackgroundClick={() => {
								if (clickRef.current === true) {
									clickRef.current = false;
									return;
								}
								setSelected(null);
							}}
						>
							<CircleGrid
								fixedChildren={
									<DistanceCircle
										color={0x0088ff}
										radius={activeRange}
										label=" "
									/>
								}
							>
								<CircleGridContacts
									selectedContactId={selected}
									onContactClick={(contact) => {
										clickRef.current = true;
										setSelected(contact);
									}}
									onPlanetClick={(contact) => {
										clickRef.current = true;
										setSelected(contact);
									}}
									onContactOcclusion={(contact, occluded) => {
										if (selected === contact) {
											setSelected(null);
										}
										setOccludedContacts((contacts) => {
											if (occluded) {
												return [...contacts, contact];
											}
											return contacts.filter((c) => c !== contact);
										});
									}}
								/>
							</CircleGrid>
						</GridCanvas>
					</Suspense>
				</div>
				<div className="flex flex-col justify-between">
					<Scans cardLoaded={cardLoaded} />
				</div>
			</div>
		</CircleGridStoreProvider>
	);
}

function Scans({ cardLoaded }: { cardLoaded: boolean }) {
	const { shipId } = useStation();
	const [scans] = q.sensors.scans.useNetRequest({ shipId });
	if (scans.length === 0) return null;
	return (
		<div className="panel panel-alert divide-y divide-white/50 overflow-y-auto max-h-full">
			{scans.map((s) => (
				<Suspense key={s.id}>
					<Scan {...s} cardLoaded={cardLoaded} />
				</Suspense>
			))}
		</div>
	);
}

function Scan({
	id,
	type,
	progress,
	repeatInterval,
	intervalTime,
	target,
	cardLoaded,
	time,
}: {
	id: number;
	type: z.infer<typeof scanTypes>;
	progress: number;
	repeatInterval: number | null;
	intervalTime: number;
	target: number;
	time: string;
	cardLoaded: boolean;
}) {
	const { shipId } = useStation();

	const { interpolate } = useLiveQuery();
	const textRef = useRef<HTMLDivElement>(null);
	const progressRef = useRef<HTMLProgressElement>(null);
	const [results] = q.sensors.scanResult.useNetRequest({
		objectId: target,
		shipId,
	});

	useAnimationFrame(() => {
		const value = interpolate(id);
		const progress = value?.x || 0;
		if (textRef.current) {
			textRef.current.innerHTML = `${Math.round(progress * 100)}%`;
		}
		if (progressRef.current) {
			progressRef.current.value = progress;
		}
	}, cardLoaded);

	const ScanComponent = ScanComponents[type];
	return (
		<div className="p-2 w-full">
			<div className="flex w-full justify-between">
				<div>
					<div>
						Scan: <span className="font-bold">{capitalCase(type)}</span>
					</div>
					<div>Target: {results.identification?.name || `Unknown ${id}`}</div>
				</div>

				{progress >= 1 ? (
					<div>{time}</div>
				) : (
					<div className="tabular-nums" ref={textRef}>
						0%
					</div>
				)}
			</div>
			{progress < 1 ? (
				<div className="flex gap-2 items-center">
					<progress
						ref={progressRef}
						className="progress progress-info"
						value={0}
						max={1}
					/>
					<Button
						className="btn btn-xs btn-error"
						onPress={() => q.sensors.scanCancel.netSend({ scanId: id })}
					>
						<Icon name="ban" />
					</Button>
				</div>
			) : ScanComponent ? (
				<div className="ml-4">
					<ScanComponent objectId={target} />
				</div>
			) : null}
		</div>
	);
}
function SensorsShipList({
	selectedId,
	setSelected,
	occludedContacts,
}: {
	selectedId: number | null;
	setSelected: (id: number | null) => void;
	occludedContacts: number[];
}) {
	const { shipId } = useStation();

	q.sensors.stream.useDataStream({ systemId: null, shipId });
	const useStarmapStore = useGetStarmapStore();
	const systemId = useStarmapStore((store) => store.currentSystem);

	const [ships] = q.starmapCore.ships.useNetRequest({ systemId });
	const [orbs] = q.starmapCore.entities.useNetRequest({ systemId });
	const scannableObjects = [
		...ships.map((ship) => ({ ...ship, type: "ship" })),
		...orbs.map((orb) => ({
			id: orb.id,
			position:
				orb.components.position ||
				(orb.components.satellite
					? getOrbitPosition(orb.components.satellite)
					: undefined),
			type: orb.components.isPlanet
				? "planet"
				: orb.components.isStar
					? "star"
					: "unknown",
		})),
	];
	// Preload all of the scan results
	const queryClient = useQueryClient();
	useEffect(() => {
		for (const object of scannableObjects) {
			queryClient.ensureQueryData({
				queryKey: q.sensors.scanResult.getQueryKey({
					shipId,
					objectId: object.id,
				}),
				queryFn: ({ signal }) =>
					q.sensors.scanResult.netRequest(
						{ shipId, objectId: object.id },
						{ signal },
					),
			});
		}
	});
	if (scannableObjects.length === 0) {
		return <h3 className="text-2xl p-2 text-center">No Objects in Range</h3>;
	}
	return (
		<DisclosureGroup
			className="panel panel-alert divide-y divide-white/50 overflow-y-auto"
			expandedKeys={selectedId ? [selectedId] : []}
			onExpandedChange={(keys) =>
				setSelected(Number(keys.values().next().value) || null)
			}
		>
			{scannableObjects.map((object) =>
				object.id === shipId || occludedContacts.includes(object.id) ? null : (
					<Suspense key={object.id}>
						<SensorsScannableObject {...object} />
					</Suspense>
				),
			)}
		</DisclosureGroup>
	);
}

function SensorsScannableObject({
	id,
	position: objectPosition,
	type,
}: {
	id: number;
	position?: { x: number; y: number; z: number };
	type: string;
}) {
	const { shipId } = useStation();
	const [{ passiveRange }] = q.sensors.get.useNetRequest({ shipId });
	const [{ id: playerShipId, currentSystem }] = q.ship.player.useNetRequest({
		clientId,
	});
	const distanceRef = useRef<HTMLSpanElement>(null);
	const { interpolate } = useLiveQuery();
	const [inRange, setInRange] = useState(false);
	useAnimationFrame(() => {
		const position = interpolate(id) || objectPosition;
		const shipPosition = interpolate(playerShipId);
		if (position && shipPosition && distanceRef.current) {
			const distance = Math.hypot(
				shipPosition.x - position.x,
				shipPosition.y - position.y,
				shipPosition.z - position.z,
			);
			const units = currentSystem ? "km" : "LY";
			distanceRef.current.innerHTML = `${Math.round(distance).toLocaleString(
				"en",
			)} ${units}`;
			if (distance > passiveRange && inRange) {
				setInRange(false);
			}
			if (distance <= passiveRange && !inRange) {
				setInRange(true);
			}
		}
	});
	const [results] = q.sensors.scanResult.useNetRequest({
		objectId: id,
		shipId,
	});
	const [waypoints] = q.waypoints.all.useNetRequest({
		shipId,
		systemId: currentSystem,
	});
	const hasWaypoint = waypoints.some((w) => w.objectId === id);
	return (
		<Disclosure id={id} className={cn("group", inRange ? "block" : "hidden")}>
			<Button
				slot="trigger"
				className="w-full outline-none focus-within:bg-white/20 px-2 group-data-[expanded]:border-b group-data-[expanded]:mb-2 border-white/50"
			>
				<div className="flex justify-between">
					{results.identification?.name || `Unknown ${id}`}
					<span ref={distanceRef} />
				</div>
			</Button>
			<DisclosurePanel className="group-data-[expanded]:pb-2 px-2">
				<ScanResults objectId={id} type={type} />
				{hasWaypoint ? null : (
					<Button
						className="btn btn-xs btn-info w-full"
						onPress={() => q.waypoints.spawn.netSend({ shipId, entityId: id })}
					>
						Add Waypoint
					</Button>
				)}
			</DisclosurePanel>
		</Disclosure>
	);
}

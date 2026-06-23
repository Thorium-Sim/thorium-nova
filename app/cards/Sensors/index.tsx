import { useQueryClient } from "@tanstack/react-query";
import type { CardProps } from "@thorium/cards/CardProps";
import { ProcessedData } from "@thorium/cards/Legacy/SensorScans/ProcessedData";
import { CircleGrid, CircleGridTiltButton, GridCanvas } from "@thorium/cards/Pilot/CircleGrid";
import { DistanceCircle } from "@thorium/cards/Pilot/DistanceCircle";
import { CircleGridContacts } from "@thorium/cards/Pilot/PilotContacts";
import { PilotZoomSlider } from "@thorium/cards/Pilot/PilotZoomSlider";
import { CircleGridStoreProvider } from "@thorium/cards/Pilot/useCircleGridStore";
import { ScanComponents, ScanResults } from "@thorium/cards/Sensors/ScanComponents";
import { useGetStarmapStore } from "@thorium/components/Starmap/starmapStore";
import { q } from "@thorium/context/AppContext";
import { useCardContext } from "@thorium/context/CardContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { useStation } from "@thorium/routes/station/useStation";
import { Icon } from "@thorium/ui/Icon";
import { cn } from "@thorium/utils/cn";
import type { scanTypes } from "@thorium/utils/flags/scanTypes";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { getCompletePositionFromOrbitClient } from "@thorium/utils/starmap/getOrbitPosition";
import { capitalCase } from "change-case";
import { Suspense, useEffect, useRef, useState } from "react";
import { Button, Disclosure, DisclosureGroup, DisclosurePanel } from "react-aria-components";
import type { z } from "zod";

import "./style.css";

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
	const [{ activeRange, passiveRange, selectedContact }] = q.sensors.get.useNetRequest({
		shipId,
	});
	const [occludedContacts, setOccludedContacts] = useState<number[]>([]);
	const clickRef = useRef(false);

	return (
		<CircleGridStoreProvider zoomMax={passiveRange}>
			<div className="grid h-full grid-cols-4 grid-rows-[100%] place-content-center gap-4">
				<div className="flex flex-col justify-between">
					<Suspense>
						<SensorsShipList selectedId={selectedContact} occludedContacts={occludedContacts} />
					</Suspense>
					<div>
						<div className="sensors-slider">
							<PilotZoomSlider />
						</div>
						<div className="sensors-tilt">
							<CircleGridTiltButton />
						</div>
					</div>
				</div>
				<div className="sensors-radar col-span-2 aspect-square max-h-full w-full max-w-full self-center justify-self-center">
					<Suspense fallback={null}>
						<GridCanvas
							shouldRender={cardLoaded}
							onBackgroundClick={() => {
								if (clickRef.current === true) {
									clickRef.current = false;
									return;
								}
								q.sensors.selectContact.netSend({ shipId, contactId: null });
							}}
						>
							<CircleGrid
								fixedChildren={<DistanceCircle color={0x0088ff} radius={activeRange} label=" " />}
							>
								<CircleGridContacts
									selectedContactId={selectedContact}
									onContactClick={(contact) => {
										clickRef.current = true;
										q.sensors.selectContact.netSend({
											shipId,
											contactId: contact,
										});
									}}
									onPlanetClick={(contact) => {
										clickRef.current = true;
										q.sensors.selectContact.netSend({
											shipId,
											contactId: contact,
										});
									}}
									onContactOcclusion={(contact, occluded) => {
										if (selectedContact === contact) {
											q.sensors.selectContact.netSend({
												shipId,
												contactId: null,
											});
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
					<div className="flex-auto" />
					<div className="processed-data flex max-h-1/2 min-h-0 flex-1 flex-col">
						<p>Processed Data</p>
						<ProcessedData className="panel panel-alert flex-1 overflow-x-hidden overflow-y-auto p-4" />
					</div>
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
		<div className="panel panel-alert scans-panel max-h-full divide-y divide-white/50 overflow-y-auto">
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
		<div className="w-full p-2">
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
				<div className="flex items-center gap-2">
					<progress
						ref={progressRef}
						className="progress progress-info flex-auto"
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
	occludedContacts,
}: {
	selectedId: number | null;
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
				(orb.components.satellite ? getCompletePositionFromOrbitClient(orb, orbs) : undefined),
			type: orb.components.isPlanet ? "planet" : orb.components.isStar ? "star" : "unknown",
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
					q.sensors.scanResult.netRequest({ shipId, objectId: object.id }, { signal }),
			});
		}
	});
	return (
		<>
			<DisclosureGroup
				className="panel panel-alert objects-list divide-y divide-white/50 overflow-y-auto"
				expandedKeys={selectedId ? [selectedId] : []}
				onExpandedChange={(keys) =>
					q.sensors.selectContact.netSend({
						shipId,
						contactId: Number(keys.values().next().value) || null,
					})
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
			<h3 className="no-objects-in-range hidden p-2 text-center text-2xl">No Objects in Range</h3>
		</>
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
	const { cardLoaded } = useCardContext();
	const {
		shipId,
		ship: { currentSystem },
	} = useStation();
	const [{ passiveRange }] = q.sensors.get.useNetRequest({ shipId });
	const distanceRef = useRef<HTMLSpanElement>(null);
	const { interpolate } = useLiveQuery();
	const [inRange, setInRange] = useState(false);
	useAnimationFrame(() => {
		const position = interpolate(id) || objectPosition;
		const shipPosition = interpolate(shipId);
		if (position && shipPosition && distanceRef.current) {
			const distance = Math.hypot(
				shipPosition.x - position.x,
				shipPosition.y - position.y,
				shipPosition.z - position.z,
			);
			const units = currentSystem ? "km" : "LY";
			distanceRef.current.innerHTML = `${distance.toLocaleString("en", {
				minimumFractionDigits: 1,
				maximumFractionDigits: 1,
			})} ${units}`;
			if (distance > passiveRange && inRange) {
				setInRange(false);
			}
			if (distance <= passiveRange && !inRange) {
				setInRange(true);
			}
		}
	}, cardLoaded);
	const [results] = q.sensors.scanResult.useNetRequest({
		objectId: id,
		shipId,
	});
	const [waypoints] = q.waypoints.all.useNetRequest({
		shipId,
		active: false,
		systemId: currentSystem,
	});
	const hasWaypoint = waypoints.some((w) => w.objectId === id);

	return (
		<Disclosure id={id} className={cn("group", inRange ? "block" : "hidden")}>
			<Button
				slot="trigger"
				className="w-full border-white/50 px-2 outline-none group-data-expanded:mb-2 group-data-expanded:border-b focus-within:bg-white/20"
			>
				<div className="flex justify-between tabular-nums">
					{results.identification?.name || `Unknown ${id}`}
					<span ref={distanceRef} />
				</div>
			</Button>
			<DisclosurePanel className="scan-options px-2 group-data-expanded:pb-2">
				<ScanResults objectId={id} type={type} />
				{hasWaypoint ? null : (
					<Button
						className="btn btn-xs btn-info w-full"
						onPress={() => q.waypoints.spawn.netSend({ shipId, entityId: id, active: false })}
					>
						Add Waypoint
					</Button>
				)}
			</DisclosurePanel>
		</Disclosure>
	);
}

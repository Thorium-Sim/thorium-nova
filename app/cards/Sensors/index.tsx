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
import { q } from "@thorium/context/AppContext";
import useAnimationFrame from "@thorium/hooks/useAnimationFrame";
import { cn } from "@thorium/utils/cn";
import { useLiveQuery } from "@thorium/utils/live-query/client";
import { Suspense, useRef, useState, type ReactNode } from "react";
import "./scanDoodad.css";
import { DistanceCircle } from "@thorium/cards/Pilot/DistanceCircle";
import { ObjectData } from "@thorium/cards/Navigation/ObjectDetails";
// import Button from "@thorium/ui/Button";
import { scanTypes } from "@thorium/utils/flags/scanTypes";
import { capitalCase } from "change-case";
import Select from "@thorium/ui/Select";
import {
	Button,
	Disclosure,
	DisclosureGroup,
	DisclosurePanel,
	Heading,
} from "react-aria-components";
import type { z } from "zod";
import { Icon } from "@thorium/ui/Icon";

/**
 * TODO:
 * - Blobs or unidentifiable icons
 * - Passive sensors data for objects
 * 		- Heat signature (just temperature)
 * 		- Heading and velocity (how to represent this?)
 *		- Distance
 *		- Size (probably just length)
 * 		- Name, Registry, other transponder details (Maybe this can be turned off or falsified?)
 * - Configure a scan to re-run
 * - Zoom and tilt controls
 */
export function Sensors({ cardLoaded }: CardProps) {
	const [{ activeRange, passiveRange }] = q.sensors.get.useNetRequest();
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
	const [scans] = q.sensors.scans.useNetRequest();
	if (scans.length === 0) return null;
	return (
		<div className="panel panel-alert divide-y divide-white/50 overflow-y-auto max-h-full">
			{scans.map((s) => (
				<Scan key={s.id} {...s} cardLoaded={cardLoaded} />
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
	const { interpolate } = useLiveQuery();
	const textRef = useRef<HTMLDivElement>(null);
	const progressRef = useRef<HTMLProgressElement>(null);

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
					Scan for: <span className="font-bold">{capitalCase(type)}</span>
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
function ScanDoodad() {
	return (
		<div className="scan-doodad">
			<div className="ring_1" />
			<div className="ring_2" />
			<div className="ring_3" />
			<div className="ring_4" />
			<div className="ring_5" />
			<div className="ring_6" />
			<div className="ring_7" />
			<div className="ring_8" />
			<div className="ring_9" />
			<div className="ring_10" />
			<div className="ring_11" />
			<div className="ring_12" />
			<div className="ring_13" />
			<div className="ring_14" />
			<div className="ring_15" />
			<div className="ring_16" />
			<div className="ring_17" />
			<div className="ring_18" />
			<div className="ring_19" />
			<div className="ring_20" />
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
	q.sensors.stream.useDataStream({ systemId: null });

	const [ships] = q.sensors.ships.useNetRequest();
	if (ships.length === 0) {
		return <h3 className="text-2xl p-2 text-center">No Ships in Range</h3>;
	}
	return (
		<DisclosureGroup
			className="panel panel-alert divide-y divide-white/50 overflow-y-auto"
			expandedKeys={selectedId ? [selectedId] : []}
			onExpandedChange={(keys) =>
				setSelected(Number(keys.values().next().value) || null)
			}
		>
			{ships.map((ship) =>
				occludedContacts.includes(ship.id) ? null : (
					<SensorsShip {...ship} key={ship.id} />
				),
			)}
		</DisclosureGroup>
	);
}

function SensorsShip({ id }: { id: number }) {
	const [{ id: playerShipId, currentSystem }] = q.ship.player.useNetRequest();
	const distanceRef = useRef<HTMLSpanElement>(null);
	const { interpolate } = useLiveQuery();
	useAnimationFrame(() => {
		const position = interpolate(id);
		const shipPosition = interpolate(playerShipId);
		if (position && shipPosition && distanceRef.current) {
			const distance = Math.hypot(
				shipPosition.x - position.x,
				shipPosition.y - position.y,
				shipPosition.z - position.z,
			);
			const units = currentSystem ? "km" : "LY";
			distanceRef.current.innerHTML = `${Math.round(distance).toLocaleString("en")} ${units}`;
		}
	});
	const [results] = q.sensors.scanResult.useNetRequest({ objectId: id });

	return (
		<Disclosure id={id} className="group">
			<Button
				slot="trigger"
				className="w-full outline-none focus-within:bg-white/20 px-2 group-data-[expanded]:border-b group-data-[expanded]:mb-2 border-white/50"
			>
				<div className="flex justify-between">
					{results.identification?.name || "Unknown"}
					<span ref={distanceRef} />
				</div>
			</Button>
			<DisclosurePanel className="group-data-[expanded]:pb-2 px-2">
				<ScanResults objectId={id} />
			</DisclosurePanel>
		</Disclosure>
	);
}

const ScanComponents = {
	shields: ShieldsResults,
	cargo: CargoResults,
	lifeSupport: null,
	targeting: TargetingResults,
	identification: IdentificationResults,
	crew: CrewResults,
	weapons: WeaponsResults,
	damage: DamageResults,
	communications: null,
};

function ScanResults({ objectId }: { objectId: number }) {
	return (
		<div className="flex flex-col gap-1">
			{scanTypes.options.map((value) => {
				const ScanComponent = ScanComponents[value];
				if (!ScanComponent) return;
				return (
					<ResultsWrapper key={value} scanType={value} objectId={objectId}>
						<ScanComponent objectId={objectId} />
					</ResultsWrapper>
				);
			})}
		</div>
	);
}

function ResultsWrapper({
	scanType,
	children,
	objectId,
}: {
	scanType: z.infer<typeof scanTypes>;
	objectId: number;
	children: ReactNode;
}) {
	const [scans] = q.sensors.scans.useNetRequest();
	const isScanning = scans.some(
		(scan) =>
			scan.target === objectId && scan.type === scanType && scan.progress < 1,
	);
	return (
		<div>
			<strong className="font-bold flex justify-between items-center">
				<span>{capitalCase(scanType)}</span>
				{isScanning ? (
					<Button className="btn btn-xs btn-info" isDisabled>
						In Progress...
					</Button>
				) : (
					<Button
						className="btn btn-xs btn-warning"
						onPress={() =>
							q.sensors.scanStart.netSend({ type: scanType, target: objectId })
						}
					>
						Begin Scan
					</Button>
				)}
			</strong>
			<div className="ml-4">{children}</div>
		</div>
	);
}

function IdentificationResults({ objectId }: { objectId: number }) {
	const [results] = q.sensors.scanResult.useNetRequest({ objectId });

	if (!results.identification) return null;

	return (
		<div>
			<div>Name: {results.identification.name}</div>
			<div>Classification: {results.identification.classification}</div>
			<div>Faction: {results.identification.factionName}</div>
		</div>
	);
}
function CargoResults({ objectId }: { objectId: number }) {
	const [results] = q.sensors.scanResult.useNetRequest({ objectId });

	if (!results.cargo) return null;
	const cargoEntries = Object.entries(results.cargo);
	return (
		<div>
			{cargoEntries.length === 0
				? "No cargo detected."
				: cargoEntries.map(([name, amount]) => (
						<div key={name}>
							{name}: {amount}
						</div>
					))}
		</div>
	);
}
function TargetingResults({ objectId }: { objectId: number }) {
	const [results] = q.sensors.scanResult.useNetRequest({ objectId });

	if (!results.targeting) return null;

	return (
		<div>
			<div>Target: {results.targeting.targetName}</div>
			<div>Targeted System: {results.targeting.targetedSystem}</div>
		</div>
	);
}
function CrewResults({ objectId }: { objectId: number }) {
	const [results] = q.sensors.scanResult.useNetRequest({ objectId });

	if (!results.crew) return null;

	return (
		<div>
			<div>Population: {results.crew.count}</div>
		</div>
	);
}
function WeaponsResults({ objectId }: { objectId: number }) {
	const [results] = q.sensors.scanResult.useNetRequest({ objectId });

	if (!results.weapons) return null;

	return (
		<div>
			{results.weapons.map((weapon, index) => (
				<div key={index} className="flex justify-between">
					<span>{capitalCase(weapon.type)}</span>
					<span>
						{weapon.type === "phasers"
							? `${weapon.charge}%`
							: `${weapon.loaded} loaded`}
					</span>
				</div>
			))}
		</div>
	);
}
function DamageResults({ objectId }: { objectId: number }) {
	const [results] = q.sensors.scanResult.useNetRequest({ objectId });

	if (!results.damage) return null;
	const damageEntries = Object.entries(results.damage);

	return (
		<div>
			{damageEntries.length === 0
				? "No damage detected"
				: damageEntries.map(([system, efficiency]) => (
						<div key={system}>
							{system}: {Math.round((1 - efficiency) * 100)}% Damaged
						</div>
					))}
		</div>
	);
}
function ShieldsResults({ objectId }: { objectId: number }) {
	const [results] = q.sensors.scanResult.useNetRequest({ objectId });

	if (!results.shields) return null;

	return (
		<div>
			<div>
				Status: {results.shields.status === "up" ? "Raised" : "Lowered"}
			</div>
			<div>
				Strength:{" "}
				{typeof results.shields.strength === "number"
					? `${Math.round(results.shields.strength * 100)}%`
					: "0%"}
			</div>
		</div>
	);
}

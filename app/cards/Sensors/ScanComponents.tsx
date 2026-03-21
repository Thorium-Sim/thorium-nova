import { ObjectImage } from "@thorium/cards/Navigation/ObjectDetails";
import { q } from "@thorium/context/AppContext";
import { useStation } from "@thorium/routes/station/useStation";
import {
	planetScanTypes,
	scanTypes,
	shipScanTypes,
	starScanTypes,
} from "@thorium/utils/flags/scanTypes";
import { capitalCase } from "change-case";
import type { z } from "zod";
import type { ReactNode } from "react";
import { Button } from "react-aria-components";

export const ScanComponents = {
	shields: ShieldsResults,
	cargo: CargoResults,
	lifeSupport: null,
	targeting: TargetingResults,
	identification: IdentificationResults,
	crew: CrewResults,
	weapons: WeaponsResults,
	engines: null,
	damage: DamageResults,
	communications: null,
	life: LifeResults,
	atmosphere: AtmosphereResults,
	temperature: TemperatureResults,
};
export function ScanResults({
	objectId,
	type,
}: {
	objectId: number;
	type: string;
}) {
	const scans =
		type === "ship"
			? shipScanTypes
			: type === "planet"
				? planetScanTypes
				: type === "star"
					? starScanTypes
					: scanTypes.options;
	return (
		<div className="flex flex-col gap-1">
			{["planet", "star"].includes(type) ? (
				<IdentificationResults objectId={objectId} />
			) : null}
			{scans.map((value) => {
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
	const { shipId } = useStation();

	const [scans] = q.sensors.scans.useNetRequest({ shipId });
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
							q.sensors.scanStart.netSend({
								shipId,
								type: scanType,
								target: objectId,
							})
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
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.identification) return null;

	return (
		<div className="flex gap-2">
			<div className="aspect-square">
				{results.identification.image ? (
					<ObjectImage objectImage={results.identification.image} />
				) : null}
			</div>
			<div>
				<div>{results.identification.name}</div>
				<div>{results.identification.classification}</div>
				<div>Faction: {results.identification.factionName}</div>
			</div>
		</div>
	);
}
function CargoResults({ objectId }: { objectId: number }) {
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.cargo) return null;
	const cargoEntries = Object.entries(results.cargo.cargo);
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
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.targeting) return null;

	return (
		<div>
			<div>Target: {results.targeting.targetName}</div>
			<div>Targeted System: {results.targeting.targetedSystem}</div>
		</div>
	);
}
function CrewResults({ objectId }: { objectId: number }) {
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.crew) return null;

	return (
		<div>
			<div>Population: {results.crew.count}</div>
		</div>
	);
}
function WeaponsResults({ objectId }: { objectId: number }) {
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.weapons) return null;

	return (
		<div>
			{results.weapons.weapons.map((weapon, index) => (
				<div key={index} className="flex justify-between">
					<span>{capitalCase(weapon.type)}</span>
					<span>
						{weapon.type === "phasers"
							? `${Math.round(weapon.charge * 100)}%`
							: `${weapon.loaded}`}
					</span>
				</div>
			))}
		</div>
	);
}
function DamageResults({ objectId }: { objectId: number }) {
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.damage) return null;
	const damageEntries = Object.entries(results.damage.damage);

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
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

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
function LifeResults({ objectId }: { objectId: number }) {
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.life) return null;

	return (
		<div>
			<div>Habitable: {results.life.isHabitable ? "Yes" : "No"}</div>
			<div>Population: {results.life.population}</div>
			<div>Lifeforms:</div>
			<ul className="list-disc ml-6">
				{results.life.lifeforms.map((l) => (
					<li key={l}>{l}</li>
				))}
			</ul>
		</div>
	);
}
function AtmosphereResults({ objectId }: { objectId: number }) {
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.atmosphere) return null;

	return (
		<ul className="list-disc ml-6">
			{results.atmosphere.atmosphere.map((a) => (
				<li key={a.component}>
					{a.component}: {a.concentration}%
				</li>
			))}
		</ul>
	);
}
function TemperatureResults({ objectId }: { objectId: number }) {
	const { shipId } = useStation();

	const [results] = q.sensors.scanResult.useNetRequest({ shipId, objectId });

	if (!results.temperature) return null;

	return (
		<div>
			<div>
				Temperature: {results.temperature.temperature.toLocaleString()} K
			</div>
		</div>
	);
}

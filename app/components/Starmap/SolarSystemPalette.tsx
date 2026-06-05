import type PlanetPlugin from "@thorium/.server/classes/Plugins/Universe/Planet";
import type SolarSystemPlugin from "@thorium/.server/classes/Plugins/Universe/SolarSystem";
import type StarPlugin from "@thorium/.server/classes/Plugins/Universe/Star";
import { q } from "@thorium/context/AppContext";
import Checkbox from "@thorium/ui/Checkbox";
import Input from "@thorium/ui/Input";
import { getOrbitPosition } from "@thorium/utils/starmap/getOrbitPosition";
import { solarRadiusToKilometers } from "@thorium/utils/unitTypes";
import { Box3, Vector3 } from "three";

import Button from "../ui/Button";
import { BasicDisclosure } from "./EditorPalettes/BasicDisclosure";
import { OrbitDisclosure } from "./EditorPalettes/OrbitDisclosure";
import { PaletteDisclosure } from "./EditorPalettes/PaletteDisclosure";
import { PlanetAssetDisclosure } from "./EditorPalettes/PlanetAssetDisclosure";
import { PlanetDisclosure } from "./EditorPalettes/PlanetDisclosure";
import { useGetStarmapStore } from "./starmapStore";
import { useSystemIds } from "./useSystemIds";

function useSelectedObject() {
	const useStarmapStore = useGetStarmapStore();

	const [pluginId, solarSystemId] = useSystemIds();
	const selectedObjectIds = useStarmapStore((state) => state.selectedObjectIds);
	const [systemData] = q.plugin.starmap.get.useNetRequest({
		pluginId,
		solarSystemId,
	});

	// It could be a system, star, or planet
	if (selectedObjectIds.includes(solarSystemId)) {
		return { type: "system" as const, object: systemData };
	}

	const star = systemData?.stars.find((star) => selectedObjectIds.includes(star.name));
	if (star) {
		return { type: "star" as const, object: star };
	}

	const planet = systemData?.planets.find((planet) => selectedObjectIds.includes(planet.name));
	if (planet) {
		return { type: "planet" as const, object: planet };
	}

	const moon = systemData?.planets.reduce((prev: PlanetPlugin | null, next) => {
		if (prev) return prev;
		return next.satellites?.find((moon) => selectedObjectIds.includes(moon.name)) || null;
	}, null);
	if (moon) {
		return { type: "planet" as const, object: moon };
	}

	return null;
}

function ZoomToObject({ object }: { object: StarPlugin | PlanetPlugin | SolarSystemPlugin }) {
	const useStarmapStore = useGetStarmapStore();

	if (!("satellite" in object)) {
		return null;
	}

	return (
		<Button
			className="btn-block btn-xs"
			onClick={() => {
				const position = getOrbitPosition(object.satellite);
				let radius = 0;
				if ("isPlanet" in object) {
					radius = object.isPlanet.radius;
				} else {
					radius = solarRadiusToKilometers(object.radius);
				}

				const box = new Box3(
					new Vector3(position.x - radius, position.y - radius, position.z - radius),
					new Vector3(position.x + radius, position.y + radius, position.z + radius),
				);
				useStarmapStore.getState().cameraControls?.current?.fitToBox(box, true);
			}}
		>
			Zoom to Object
		</Button>
	);
}

function StarDisclosure({ object }: { object: StarPlugin }) {
	const [pluginId, solarSystemId] = useSystemIds();

	return (
		<PaletteDisclosure title="Star">
			<Input
				label="Spectral Type"
				helperText="Cannot be changed"
				type="text"
				readOnly
				defaultValue={object.spectralType}
			/>
			<Input
				label="Solar Mass"
				helperText="The mass of the star compared to the Sun"
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.solarMass}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						solarMass: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Age"
				helperText="The age of the star in years"
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.age}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						age: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Radius"
				helperText="The radius of the star compared to the radius of the sun."
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.radius}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						radius: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Temperature"
				helperText="The temperature of the star in Kelvin."
				type="text"
				inputMode="numeric"
				pattern="[0-9]*"
				defaultValue={object.temperature}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						temperature: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Input
				label="Hue"
				helperText="The hue of the star"
				type="range"
				min={0}
				max={360}
				step={1}
				defaultValue={object.hue}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						hue: Number.parseFloat(e.target.value),
					});
				}}
			/>
			<Checkbox
				label="White Star"
				helperText="If checked, the star will be white. Overrides hue."
				defaultChecked={object.isWhite}
				onChange={(e) => {
					q.plugin.starmap.star.update.netSend({
						pluginId,
						solarSystemId,
						starId: object.name,
						isWhite: e.target.checked,
					});
				}}
			/>
		</PaletteDisclosure>
	);
}

export function SolarSystemPalette() {
	const results = useSelectedObject();
	if (!results || !results.object) return null;
	return (
		<div
			className="h-full w-full overflow-x-hidden overflow-y-auto text-white"
			key={results.object.name}
		>
			<ZoomToObject object={results.object} />
			<BasicDisclosure object={results.object} type={results.type} />
			{results.type === "planet" && (
				<>
					<PlanetDisclosure object={results.object} />
					<PlanetAssetDisclosure object={results.object} />
					<OrbitDisclosure object={results.object} />
				</>
			)}
			{results.type === "star" && <StarDisclosure object={results.object} />}
		</div>
	);
}

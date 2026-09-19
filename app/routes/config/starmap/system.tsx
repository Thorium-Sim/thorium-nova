import { Planet } from "@thorium/components/Starmap/Planet";
import { SolarSystemMap } from "@thorium/components/Starmap/SolarSystemMap";
import StarEntity from "@thorium/components/Starmap/Star";
import { Starbase } from "@thorium/components/Starmap/Starbase";
import { useSystemIds } from "@thorium/components/Starmap/useSystemIds";
import { q } from "@thorium/context/AppContext";
import { useMemo, Fragment } from "react";

export default function SolarSystemWrapper({
	systemId,
	children,
}: {
	systemId?: string;
	children?: React.ReactNode;
}) {
	let [pluginId, solarSystemId] = useSystemIds() as [string, string];
	if (systemId) {
		solarSystemId = systemId;
	}
	const [systemData] = q.plugin.starmap.get.useNetRequest(
		{
			pluginId,
			solarSystemId,
		},
		{ enabled: !!solarSystemId, placeholderData: { stars: [], planets: [] } },
	);

	const entities = useMemo(
		() => systemData?.planets.map((p) => ({ id: p.name, satellite: p.satellite })),
		[systemData?.planets],
	);

	if (!systemData) return null;
	return (
		<SolarSystemMap skyboxKey={systemData.skyboxKey} systemId={solarSystemId}>
			{systemData.stars.map((star) => (
				<StarEntity key={star.name} star={{ id: star.name, ...star }} />
			))}
			{systemData.planets.map((planet) => (
				<Fragment key={planet.name}>
					<Planet
						key={planet.name}
						planet={{
							id: planet.name,
							name: planet.name,
							isPlanet: planet.isPlanet,
							satellite: planet.satellite,
						}}
						entities={entities}
					/>
					{planet.satellites?.map((s) =>
						s.type === "starbase" ? (
							<Starbase
								key={s.name}
								starbase={{
									id: s.name,
									name: s.name,
									isStarbase: s.isStarbase,
									satellite: s.satellite,
									mass: s.mass,
									length: s.length,
									population: s.population,
								}}
								isSatellite
								entities={entities}
							/>
						) : (
							<Planet
								key={s.name}
								planet={{
									id: s.name,
									name: s.name,
									isPlanet: s.isPlanet,
									satellite: s.satellite,
								}}
								entities={entities}
								isSatellite
							/>
						),
					)}
				</Fragment>
			))}
			{children}
		</SolarSystemMap>
	);
}

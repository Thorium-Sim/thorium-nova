import {Planet} from "@client/components/Starmap/Planet";
import {SolarSystemMap} from "@client/components/Starmap/SolarSystemMap";
import StarEntity from "@client/components/Starmap/Star";
import {useSystemIds} from "@client/components/Starmap/useSystemIds";
import {q} from "@client/context/AppContext";

export default function SolarSystemWrapper() {
  const [pluginId, solarSystemId] = useSystemIds() as [string, string];
  const [systemData] = q.plugin.starmap.get.useNetRequest(
    {
      pluginId,
      solarSystemId,
    },
    {enabled: !!solarSystemId, placeholderData: {stars: [], planets: []}}
  );

  return (
    <SolarSystemMap skyboxKey={systemData.skyboxKey}>
      {systemData.stars.map(star => (
        <StarEntity key={star.name} star={{id: star.name, ...star}} />
      ))}
      {systemData.planets.map(planet => (
        <Planet
          key={planet.name}
          planet={{
            id: planet.name,
            name: planet.name,
            isPlanet: planet.isPlanet,
            satellite: planet.satellite,
          }}
        />
      ))}
    </SolarSystemMap>
  );
}

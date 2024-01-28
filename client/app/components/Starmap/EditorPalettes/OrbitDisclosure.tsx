import Input from "@thorium/ui/Input";
import Checkbox from "@thorium/ui/Checkbox";
import PlanetPlugin from "@server/classes/Plugins/Universe/Planet";
import StarPlugin from "@server/classes/Plugins/Universe/Star";
import {PaletteDisclosure} from "../SolarSystemMap";
import {useSystemIds} from "../useSystemIds";
import {q} from "@client/context/AppContext";

export function OrbitDisclosure({object}: {object: PlanetPlugin | StarPlugin}) {
  const [pluginId, solarSystemId] = useSystemIds();

  return (
    <PaletteDisclosure title="Orbit">
      <Input
        label="Semi-major Axis"
        helperText="The distance from the object's parent to the object in kilometers"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.satellite.semiMajorAxis}
        onChange={e => {
          const body = {
            pluginId,
            solarSystemId,
            satellite: {
              semiMajorAxis: parseFloat(e.target.value),
            },
          };
          if ("isPlanet" in object) {
            q.plugin.starmap.planet.update.netSend({
              ...body,
              planetId: object.name,
            });
          } else {
            q.plugin.starmap.star.update.netSend({
              ...body,
              starId: object.name,
            });
          }
        }}
      />
      <Input
        label="Orbital Arc"
        helperText="The angle in degrees of the object's progression in its orbit."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.satellite.orbitalArc}
        onChange={e => {
          const body = {
            pluginId,
            solarSystemId,
            satellite: {
              orbitalArc: parseFloat(e.target.value),
            },
          };
          if ("isPlanet" in object) {
            q.plugin.starmap.planet.update.netSend({
              ...body,
              planetId: object.name,
            });
          } else {
            q.plugin.starmap.star.update.netSend({
              ...body,
              starId: object.name,
            });
          }
        }}
      />
      <Input
        label="Inclination"
        helperText="The up or down angle in degrees of the object's orbit, between -90˚ and 90˚"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.satellite.inclination}
        onChange={e => {
          const body = {
            pluginId,
            solarSystemId,
            satellite: {
              inclination: parseFloat(e.target.value),
            },
          };
          if ("isPlanet" in object) {
            q.plugin.starmap.planet.update.netSend({
              ...body,
              planetId: object.name,
            });
          } else {
            q.plugin.starmap.star.update.netSend({
              ...body,
              starId: object.name,
            });
          }
        }}
      />
      <Input
        label="Eccentricity"
        helperText="Number between 0 - 1 of how elliptical the orbit is."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.satellite.eccentricity}
        onChange={e => {
          const body = {
            pluginId,
            solarSystemId,
            satellite: {
              eccentricity: parseFloat(e.target.value),
            },
          };
          if ("isPlanet" in object) {
            q.plugin.starmap.planet.update.netSend({
              ...body,
              planetId: object.name,
            });
          } else {
            q.plugin.starmap.star.update.netSend({
              ...body,
              starId: object.name,
            });
          }
        }}
      />
      <Input
        label="Axial Tilt"
        helperText="The tilt of the object in degrees."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.satellite.axialTilt}
        onChange={e => {
          const body = {
            pluginId,
            solarSystemId,
            satellite: {
              axialTilt: parseFloat(e.target.value),
            },
          };
          if ("isPlanet" in object) {
            q.plugin.starmap.planet.update.netSend({
              ...body,
              planetId: object.name,
            });
          } else {
            q.plugin.starmap.star.update.netSend({
              ...body,
              starId: object.name,
            });
          }
        }}
      />
      {"isPlanet" in object && (
        <Checkbox
          label="Show Orbit Path"
          defaultChecked={object.satellite.showOrbit}
          onChange={e => {
            q.plugin.starmap.planet.update.netSend({
              pluginId,
              solarSystemId,
              satellite: {
                showOrbit: e.target.checked,
              },
              planetId: object.name,
            });
          }}
        />
      )}
    </PaletteDisclosure>
  );
}

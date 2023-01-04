import * as React from "react";
import Input from "@thorium/ui/Input";
import Checkbox from "@thorium/ui/Checkbox";
import PlanetPlugin from "server/src/classes/Plugins/Universe/Planet";
import {PaletteDisclosure} from "../SolarSystemMap";
import {useSystemIds} from "../useSystemIds";
import {q} from "@client/context/AppContext";

export function PlanetDisclosure({object}: {object: PlanetPlugin}) {
  const [pluginId, solarSystemId] = useSystemIds();

  return (
    <PaletteDisclosure title="Planet">
      <Input
        label="Age"
        helperText="The age of the planet in years."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.isPlanet.age}
        onChange={e => {
          q.plugin.starmap.planet.update.netSend({
            pluginId,
            solarSystemId,
            planetId: object.name,
            age: parseFloat(e.target.value),
          });
        }}
      />
      <Input
        readOnly
        label="Classification"
        defaultValue={object.isPlanet.classification}
        helperText="The planet's classification This cannot be changed."
      />

      <Input
        label="Radius"
        helperText="The radius of the planet in kilometers."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.isPlanet.radius}
        onChange={e => {
          q.plugin.starmap.planet.update.netSend({
            pluginId,
            solarSystemId,
            planetId: object.name,
            radius: parseFloat(e.target.value),
          });
        }}
      />
      <Input
        label="Mass"
        helperText="The mass of the planet compared to Earth."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.isPlanet.terranMass}
        onChange={e => {
          q.plugin.starmap.planet.update.netSend({
            pluginId,
            solarSystemId,
            planetId: object.name,
            terranMass: parseFloat(e.target.value),
          });
        }}
      />
      <Checkbox
        label="Habitable"
        helperText="Whether the planet is habitable by humans."
        defaultChecked={object.isPlanet.isHabitable}
        onChange={e => {
          q.plugin.starmap.planet.update.netSend({
            pluginId,
            solarSystemId,
            planetId: object.name,
            isHabitable: e.target.checked,
          });
        }}
      />
      <Input
        label="Temperature"
        helperText="The temperature of the planet's surface in Kelvin."
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        defaultValue={object.temperature}
        onChange={e => {
          q.plugin.starmap.planet.update.netSend({
            pluginId,
            solarSystemId,
            planetId: object.name,
            temperature: parseFloat(e.target.value),
          });
        }}
      />
      <Input
        label="Lifeforms"
        as="textarea"
        helperText="A text description of the types of lifeforms that inhabit this planet."
        defaultValue={object.isPlanet.lifeforms.join(" ")}
        onChange={e => {
          q.plugin.starmap.planet.update.netSend({
            pluginId,
            solarSystemId,
            planetId: object.name,
            lifeforms: [e.target.value],
          });
        }}
      />
    </PaletteDisclosure>
  );
}

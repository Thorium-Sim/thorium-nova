import {
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/core";
import {
  useUniversePlanetSetAgeMutation,
  useUniversePlanetSetHabitableMutation,
  useUniversePlanetSetLifeformsMutation,
  useUniversePlanetSetRadiusMutation,
  useUniversePlanetSetTemperatureMutation,
  useUniversePlanetSetTerranMassMutation,
} from "../../../generated/graphql";
import React from "react";
import {useTranslation} from "react-i18next";
import {useConfigStore} from "../configStore";
import {isPlanet} from "./utils";

const PlanetPalette: React.FC = () => {
  const {t} = useTranslation();
  const universeId = useConfigStore(store => store.universeId);
  const selectedObject = useConfigStore(store => store.selectedObject);

  const [setAge] = useUniversePlanetSetAgeMutation();
  const [setHabitable] = useUniversePlanetSetHabitableMutation();
  const [setLifeforms] = useUniversePlanetSetLifeformsMutation();
  const [setRadius] = useUniversePlanetSetRadiusMutation();
  const [setTemperature] = useUniversePlanetSetTemperatureMutation();
  const [setTerranMass] = useUniversePlanetSetTerranMassMutation();

  if (!selectedObject || !isPlanet(selectedObject)) return null;
  return (
    <>
      <FormControl>
        <FormLabel htmlFor="age">{t("Age")}</FormLabel>
        <Input
          id="age"
          defaultValue={selectedObject.isPlanet.age}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAge({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                age: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The age of the planet in years.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="classification">{t("Classification")}</FormLabel>
        <Input
          id="classification"
          defaultValue={selectedObject.isPlanet.classification}
          type="text"
          isReadOnly
        />
        <FormHelperText width={300}>
          The planet's classification This cannot be changed.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="radius">{t("Radius")}</FormLabel>
        <Input
          id="radius"
          defaultValue={selectedObject.isPlanet.radius}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRadius({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                radius: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The radius of the planet in kilometers.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="terranMass">{t("Terran Mass")}</FormLabel>
        <Input
          id="terranMass"
          defaultValue={selectedObject.isPlanet.terranMass}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTerranMass({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                terranMass: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The mass of the planet compared to Earth
        </FormHelperText>
      </FormControl>
      <FormControl>
        <Checkbox
          defaultIsChecked={selectedObject.isPlanet.habitable}
          size="lg"
          onChange={e =>
            setHabitable({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                habitable: e.target.checked,
              },
            })
          }
        >
          {t("Habitable")}
        </Checkbox>
        <FormHelperText width={300}>
          Whether the planet is habitable by humans.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="lifeforms">{t("Lifeforms")}</FormLabel>
        <Textarea
          id="lifeforms"
          defaultValue={selectedObject.isPlanet.lifeforms}
          type="text"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLifeforms({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                lifeforms: e.target.value,
              },
            })
          }
        />
        <FormHelperText width={300}>
          A text description of the types of lifeforms that inhabit this planet.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="temperature">{t("Temperature")}</FormLabel>
        <Input
          id="temperature"
          defaultValue={selectedObject.temperature.temperature}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTemperature({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                temperature: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The temperature of the planet's surface in Kelvin. Affects the
          habitable zone.
        </FormHelperText>
      </FormControl>
    </>
  );
};
export default PlanetPalette;

import {
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/core";
import {
  useUniverseStarSetAgeMutation,
  useUniverseStarSetHueMutation,
  useUniverseStarSetIsWhiteMutation,
  useUniverseStarSetRadiusMutation,
  useUniverseStarSetSolarMassMutation,
  useUniverseStarSetTemperatureMutation,
} from "../../../generated/graphql";

import React from "react";
import {useTranslation} from "react-i18next";
import {useConfigStore} from "../configStore";
import {isStar} from "./utils";

const StarPalette: React.FC = () => {
  const {t} = useTranslation();
  const universeId = useConfigStore(store => store.universeId);
  const selectedObject = useConfigStore(store => store.selectedObject);
  const [setAge] = useUniverseStarSetAgeMutation();
  const [setRadius] = useUniverseStarSetRadiusMutation();
  const [setHue] = useUniverseStarSetHueMutation();
  const [setIsWhite] = useUniverseStarSetIsWhiteMutation();
  const [setSolarMass] = useUniverseStarSetSolarMassMutation();
  const [setTemperature] = useUniverseStarSetTemperatureMutation();

  if (!selectedObject || !isStar(selectedObject)) return null;
  return (
    <>
      <FormControl>
        <FormLabel htmlFor="solarMass">{t("Solar Mass")}</FormLabel>
        <Input
          id="solarMass"
          defaultValue={selectedObject.isStar.solarMass}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSolarMass({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                solarMass: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The mass of the star compared to the Sun.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="age">{t("Age")}</FormLabel>
        <Input
          id="age"
          defaultValue={selectedObject.isStar.age}
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
          The age of the star in years.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="radius">{t("Radius")}</FormLabel>
        <Input
          id="radius"
          defaultValue={selectedObject.isStar.radius}
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
          The radius of the star compared to the radius of the sun. Affects the
          habitable zone.
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
          The temperature of the star in Kelvin. Affects the habitable zone.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="spectralType">{t("Spectral Type")}</FormLabel>
        <Input
          id="spectralType"
          defaultValue={selectedObject.isStar.spectralType}
          isReadOnly
        />
        <FormHelperText width={300}>
          The spectral type of the star. This cannot be changed.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="hue">{t("Hue")}</FormLabel>
        <Input
          id="hue"
          defaultValue={selectedObject.isStar.hue}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setHue({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                hue: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The hue of the star in degrees.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <Checkbox
          defaultIsChecked={selectedObject.isStar.isWhite}
          size="lg"
          onChange={e =>
            setIsWhite({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                isWhite: e.target.checked,
              },
            })
          }
        >
          {t("Is White")}
        </Checkbox>
        <FormHelperText width={300}>
          Whether the star is white. Overrides hue.
        </FormHelperText>
      </FormControl>
    </>
  );
};
export default StarPalette;

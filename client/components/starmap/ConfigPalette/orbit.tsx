import React from "react";
import {
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/core";
import {
  useUniverseSatelliteSetAxialTiltMutation,
  useUniverseSatelliteSetDistanceMutation,
  useUniverseSatelliteSetEccentricityMutation,
  useUniverseSatelliteSetOrbitalArcMutation,
  useUniverseSatelliteSetOrbitalInclinationMutation,
  useUniverseSatelliteSetShowOrbitMutation,
} from "../../../generated/graphql";
import {useConfigStore} from "../configStore";
import {useTranslation} from "react-i18next";
import {hasOrbit} from "./utils";

const OrbitPalette: React.FC = () => {
  const {t} = useTranslation();
  const universeId = useConfigStore(store => store.universeId);
  const selectedObject = useConfigStore(store => store.selectedObject);

  const [setAxialTilt] = useUniverseSatelliteSetAxialTiltMutation();
  const [setDistance] = useUniverseSatelliteSetDistanceMutation();
  const [setEccentricity] = useUniverseSatelliteSetEccentricityMutation();
  const [setOrbitalArc] = useUniverseSatelliteSetOrbitalArcMutation();
  const [
    setOrbitalInclination,
  ] = useUniverseSatelliteSetOrbitalInclinationMutation();
  const [setShowOrbit] = useUniverseSatelliteSetShowOrbitMutation();

  if (!selectedObject || !hasOrbit(selectedObject)) return null;

  return (
    <>
      <FormControl>
        <FormLabel htmlFor="axialTilt">{t("Axial Tilt")}</FormLabel>
        <Input
          id="axialTilt"
          defaultValue={selectedObject.satellite.axialTilt}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAxialTilt({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                axialTilt: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The tilt of the object in degrees.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="distance">{t("Orbit Radius")}</FormLabel>
        <Input
          id="distance"
          defaultValue={selectedObject.satellite.distance}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDistance({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                distance: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The distance from the center of the system to the object in
          kilometers.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="orbitalArc">{t("Orbit Arc")}</FormLabel>
        <Input
          id="orbitalArc"
          defaultValue={selectedObject.satellite.orbitalArc}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOrbitalArc({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                orbitalArc: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The angle in degrees of the object's progression in its orbit.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="orbitalInclination">
          {t("Orbital Inclination")}
        </FormLabel>
        <Input
          id="orbitalInclination"
          defaultValue={selectedObject.satellite.orbitalInclination}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setOrbitalInclination({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                orbitalInclination: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          The up or down angle in degrees of the object's orbit.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="eccentricity">{t("Eccentricity")}</FormLabel>
        <Input
          id="eccentricity"
          defaultValue={selectedObject.satellite.eccentricity}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEccentricity({
              variables: {
                id: universeId,
                objectId: selectedObject.id,
                eccentricity: parseFloat(e.target.value),
              },
            })
          }
        />
        <FormHelperText width={300}>
          Number between 0 - 1 of how elliptical the orbit is.
        </FormHelperText>
      </FormControl>
      <Checkbox
        defaultIsChecked={selectedObject.satellite.showOrbit}
        size="lg"
        onChange={e =>
          setShowOrbit({
            variables: {
              id: universeId,
              objectId: selectedObject.id,
              showOrbit: e.target.checked,
            },
          })
        }
      >
        {t("Show Orbit Path")}
      </Checkbox>
    </>
  );
};
export default OrbitPalette;

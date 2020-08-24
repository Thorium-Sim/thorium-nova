import {
  Accordion,
  AccordionHeader,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Textarea,
} from "@chakra-ui/core";
import {
  useUniverseSystemSetNameMutation,
  useUniverseSystemSetDescriptionMutation,
  TemplateSystemSubscription,
  useUniverseSystemSetSkyboxMutation,
  useUniverseSatelliteSetAxialTiltMutation,
  useUniverseSatelliteSetDistanceMutation,
  useUniverseSatelliteSetEccentricityMutation,
  useUniverseSatelliteSetOrbitalArcMutation,
  useUniverseSatelliteSetOrbitalInclinationMutation,
  useUniverseSatelliteSetShowOrbitMutation,
} from "../../generated/graphql";
import React, {ChangeEvent} from "react";
import PropertyPalette from "../ui/propertyPalette";
import {configStoreApi, useConfigStore} from "./configStore";
import throttle from "lodash.throttle";
import {useTranslation} from "react-i18next";
import randomWords from "random-words";

function isSystem(
  obj: any
): obj is NonNullable<TemplateSystemSubscription["templateUniverseSystem"]> {
  return !!obj.planetarySystem;
}
function hasOrbit(
  obj: any
): obj is {
  satellite: NonNullable<
    TemplateSystemSubscription["templateUniverseSystem"]["items"][0]["satellite"]
  >;
} {
  return !!obj.satellite;
}
function isStar(
  obj: any
): obj is NonNullable<
  TemplateSystemSubscription["templateUniverseSystem"]["items"][0]
> {
  return !!obj.isStar;
}
function isPlanet(
  obj: any
): obj is NonNullable<
  TemplateSystemSubscription["templateUniverseSystem"]["items"][0]
> {
  return !!obj.isPlanet;
}

const ConfigPalette: React.FC = () => {
  const {t} = useTranslation();
  const universeId = useConfigStore(store => store.universeId);
  const setSystemId = useConfigStore(store => store.setSystemId);
  const selectedObject = useConfigStore(store => store.selectedObject);
  const systemId = useConfigStore(store => store.systemId);
  const [setName] = useUniverseSystemSetNameMutation();
  const [setDescription] = useUniverseSystemSetDescriptionMutation();
  const [setSkyboxKey] = useUniverseSystemSetSkyboxMutation();

  const [setAxialTilt] = useUniverseSatelliteSetAxialTiltMutation();
  const [setDistance] = useUniverseSatelliteSetDistanceMutation();
  const [setEccentricity] = useUniverseSatelliteSetEccentricityMutation();
  const [setOrbitalArc] = useUniverseSatelliteSetOrbitalArcMutation();
  const [
    setOrbitalInclination,
  ] = useUniverseSatelliteSetOrbitalInclinationMutation();
  const [setShowOrbit] = useUniverseSatelliteSetShowOrbitMutation();

  const objectId = selectedObject?.id;
  const updateName = React.useMemo(
    () =>
      throttle((name: string) => {
        if (!objectId || !universeId) return;
        setName({
          variables: {id: universeId, systemId: objectId, name},
        });
      }, 500),
    [objectId]
  );
  const updateDescription = React.useMemo(
    () =>
      throttle((description: string) => {
        if (!objectId || !universeId) return;
        setDescription({
          variables: {id: universeId, systemId: objectId, description},
        });
      }, 500),
    [objectId]
  );

  const skyboxKeyRef = React.useRef<HTMLInputElement>(null);

  if (!selectedObject) return null;

  return (
    <PropertyPalette
      key={selectedObject.id}
      onClose={() => configStoreApi.setState({selectedObject: null})}
    >
      <Accordion>
        <AccordionItem>
          <AccordionHeader>
            <Box flex="1" textAlign="left">
              {t("Basics")}
            </Box>
            <AccordionIcon />
          </AccordionHeader>
          <AccordionPanel>
            <FormControl>
              <FormLabel htmlFor="name">{t("Name")}</FormLabel>
              <Input
                id="name"
                defaultValue={selectedObject.identity.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateName(e.target.value.trim())
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="description">{t("Description")}</FormLabel>
              <Textarea
                id="description"
                defaultValue={selectedObject.identity.description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateDescription(e.target.value)
                }
              />
            </FormControl>
            {/* TODO: Include Faction here eventually... when we get factions */}
            {isSystem(selectedObject) && !systemId && (
              <Button
                size="sm"
                variant="ghost"
                variantColor="primary"
                mt={2}
                width="100%"
                onClick={async () => {
                  setSystemId(selectedObject.id);
                }}
              >
                Enter System
              </Button>
            )}
            {isSystem(selectedObject) && systemId && (
              <>
                <FormControl>
                  <FormLabel htmlFor="skyboxKey">{t("Skybox Key")}</FormLabel>
                  <Flex>
                    <Input
                      id="skyboxKey"
                      flex={1}
                      ref={skyboxKeyRef}
                      defaultValue={selectedObject.planetarySystem.skyboxKey}
                      onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSkyboxKey({
                          variables: {
                            id: universeId,
                            systemId,
                            skyboxKey: e.target.value,
                          },
                        })
                      }
                    />
                    <IconButton
                      icon="repeat"
                      aria-label={t(`Random String`)}
                      onClick={() => {
                        const string = randomWords(3).join(" ");
                        if (skyboxKeyRef.current) {
                          skyboxKeyRef.current.value = string;
                        }
                        setSkyboxKey({
                          variables: {
                            id: universeId,
                            systemId,
                            skyboxKey: string,
                          },
                        });
                      }}
                    ></IconButton>
                  </Flex>
                  <FormHelperText id="skybox-key-helper-text" width={300}>
                    A string of text used to randomly generate the nebula
                    background inside solar systems.
                  </FormHelperText>
                </FormControl>
              </>
            )}
          </AccordionPanel>
        </AccordionItem>
        {hasOrbit(selectedObject) && (
          <AccordionItem>
            <AccordionHeader>
              <Box flex="1" textAlign="left">
                {t("Orbit")}
              </Box>
              <AccordionIcon />
            </AccordionHeader>
            <AccordionPanel>
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
                <FormLabel htmlFor="eccentricity">
                  {t("Eccentricity")}
                </FormLabel>
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
            </AccordionPanel>
          </AccordionItem>
        )}
        {isStar(selectedObject) && (
          <AccordionItem>
            <AccordionHeader>
              <Box flex="1" textAlign="left">
                {t("Star Properties")}
              </Box>
              <AccordionIcon />
            </AccordionHeader>
            <AccordionPanel></AccordionPanel>
          </AccordionItem>
        )}
        {isPlanet(selectedObject) && (
          <AccordionItem>
            <AccordionHeader>
              <Box flex="1" textAlign="left">
                {t("Planet Properties")}
              </Box>
              <AccordionIcon />
            </AccordionHeader>
            <AccordionPanel></AccordionPanel>
          </AccordionItem>
        )}
      </Accordion>
    </PropertyPalette>
  );
};

export default ConfigPalette;

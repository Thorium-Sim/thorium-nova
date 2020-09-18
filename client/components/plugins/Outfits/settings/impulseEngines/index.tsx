import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/core";
import React from "react";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router";
import {OutfitDefinition} from "../outfitType";
import {
  useImpulseEnginesSubscription,
  useImpulseEnginesSetCruisingSpeedMutation,
  useImpulseEnginesSetEmergencySpeedMutation,
  useImpulseEnginesSetThrustMutation,
} from "../../../../../generated/graphql";

export const OutfitImpulseEngines: React.FC<{outfit: OutfitDefinition}> = ({
  outfit,
}) => {
  const {t} = useTranslation();
  const {pluginId} = useParams();
  const {data} = useImpulseEnginesSubscription({
    variables: {pluginId, outfitId: outfit.id, shipId: null},
  });
  const [setCruisingSpeed] = useImpulseEnginesSetCruisingSpeedMutation();
  const [setEmergencySpeed] = useImpulseEnginesSetEmergencySpeedMutation();
  const [setThrust] = useImpulseEnginesSetThrustMutation();
  const impulseEngines = data?.impulseEnginesOutfit?.impulseEngines;
  if (!impulseEngines) return <div>Loading...</div>;
  return (
    <Box as="fieldset" key={outfit.id} flex={1} overflowY="auto">
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Cruising Speed`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={impulseEngines.cruisingSpeed}
                placeholder="1500"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const speed = parseInt(e.target.value, 10);
                  if (!isNaN(speed)) {
                    setCruisingSpeed({
                      variables: {
                        pluginId,
                        outfitId: outfit.id,
                        shipId: null,
                        speed,
                      },
                    });
                  }
                }}
              />
            </FormLabel>
            <FormHelperText id="email-helper-text">
              {t(`The maximum cruising speed in km/s. `)}
            </FormHelperText>
          </FormControl>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Emergency Speed`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={impulseEngines.emergencySpeed}
                placeholder="2000"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const speed = parseInt(e.target.value, 10);
                  if (!isNaN(speed)) {
                    setEmergencySpeed({
                      variables: {
                        pluginId,
                        outfitId: outfit.id,
                        shipId: null,
                        speed,
                      },
                    });
                  }
                }}
              />
            </FormLabel>
            <FormHelperText id="email-helper-text">
              {t(`The maximum emergency speed in km/s. `)}
            </FormHelperText>
          </FormControl>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Thrust`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={impulseEngines.thrust}
                placeholder="2000"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const thrust = parseInt(e.target.value, 10);
                  if (!isNaN(thrust)) {
                    setThrust({
                      variables: {
                        pluginId,
                        outfitId: outfit.id,
                        shipId: null,
                        thrust,
                      },
                    });
                  }
                }}
              />
            </FormLabel>
            <FormHelperText id="email-helper-text">
              {t(
                `The engine thrust output in kilo-Newtons. This affects how long it takes to accelerate to top speed. If this is the same as the mass of the ship, it will take about 5 seconds to reach cruising speed.`
              )}
            </FormHelperText>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

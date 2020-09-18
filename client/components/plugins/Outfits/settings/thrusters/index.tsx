import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/core";
import {
  useThrustersSubscription,
  useThrustersSetDirectionMaxSpeedMutation,
  useThrustersSetDirectionThrustMutation,
  useThrustersSetRotationMaxSpeedMutation,
  useThrustersSetRotationThrustMutation,
} from "../../../../../generated/graphql";
import React from "react";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router";
import {OutfitDefinition} from "../outfitType";

export const OutfitThrusters: React.FC<{outfit: OutfitDefinition}> = ({
  outfit,
}) => {
  const {t} = useTranslation();
  const {pluginId} = useParams();
  const {data} = useThrustersSubscription({
    variables: {pluginId, outfitId: outfit.id, shipId: null},
  });
  const [setDirectionMaxSpeed] = useThrustersSetDirectionMaxSpeedMutation();
  const [setDirectionThrust] = useThrustersSetDirectionThrustMutation();
  const [setRotationMaxSpeed] = useThrustersSetRotationMaxSpeedMutation();
  const [setRotationThrust] = useThrustersSetRotationThrustMutation();
  const thrusters = data?.thrustersOutfit?.thrusters;
  if (!thrusters) return <div>Loading...</div>;
  return (
    <Box as="fieldset" key={outfit.id} flex={1} overflowY="auto">
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Rotation Max Speed`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={thrusters.rotationMaxSpeed}
                placeholder="1"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const speed = parseInt(e.target.value, 10);
                  if (!isNaN(speed)) {
                    setRotationMaxSpeed({
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
              {t(
                `The maximum speed which the ship can rotate in rotations per minute. `
              )}
            </FormHelperText>
          </FormControl>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Rotation Thrust`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={thrusters.rotationThrust}
                placeholder="1"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const thrust = parseInt(e.target.value, 10);
                  if (!isNaN(thrust)) {
                    setRotationThrust({
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
                `The thrust applied by rotation thrusters in kilo-Newtons, which affects rotation acceleration based on the mass of the ship. `
              )}
            </FormHelperText>
          </FormControl>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Direction Max Speed`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={thrusters.directionMaxSpeed}
                placeholder="1"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const speed = parseInt(e.target.value, 10);
                  if (!isNaN(speed)) {
                    setDirectionMaxSpeed({
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
              {t(
                `The maximum speed which can be applied by direction thrusters in meters/second. `
              )}
            </FormHelperText>
          </FormControl>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Direction Thrust`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={thrusters.directionThrust}
                placeholder="1"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const thrust = parseInt(e.target.value, 10);
                  if (!isNaN(thrust)) {
                    setDirectionThrust({
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
                `The thrust applied by direction thrusters in kilo-Newtons, which affects thruster acceleration based on the mass of the ship. `
              )}
            </FormHelperText>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

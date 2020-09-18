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
  useNavigationOutfitSubscription,
  useNavigationSetDestinationRadiusMutation,
} from "../../../../../generated/graphql";

export const OutfitNavigation: React.FC<{outfit: OutfitDefinition}> = ({
  outfit,
}) => {
  const {t} = useTranslation();
  const {pluginId} = useParams();
  const {data} = useNavigationOutfitSubscription({
    variables: {pluginId, outfitId: outfit.id, shipId: null},
  });
  const [setRadius] = useNavigationSetDestinationRadiusMutation();
  const navigation = data?.navigationOutfit?.navigation;
  if (!navigation) return <div>Loading...</div>;
  return (
    <Box as="fieldset" key={outfit.id} flex={1} overflowY="auto">
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Max Destination Radius`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={navigation.maxDestinationRadius}
                placeholder="0"
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const radius = parseInt(e.target.value, 10);
                  if (!isNaN(radius)) {
                    setRadius({
                      variables: {
                        pluginId,
                        outfitId: outfit.id,
                        shipId: null,
                        radius,
                      },
                    });
                  }
                }}
              />
            </FormLabel>
            <FormHelperText id="email-helper-text">
              {t(
                `The maximum radius which destinations can be set in lightyears. 0 is unlimited radius.`
              )}
            </FormHelperText>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

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
  useWarpEnginesSubscription,
  useWarpEnginesSetWarpFactorCountMutation,
} from "../../../../../generated/graphql";

export const OutfitWarpEngines: React.FC<{outfit: OutfitDefinition}> = ({
  outfit,
}) => {
  const {t} = useTranslation();
  const {pluginId} = useParams();
  const {data} = useWarpEnginesSubscription({
    variables: {pluginId, outfitId: outfit.id, shipId: null},
  });
  const [setWarpFactorCount] = useWarpEnginesSetWarpFactorCountMutation();
  const warpEngines = data?.warpEnginesOutfit?.warpEngines;
  return (
    <Box as="fieldset" key={outfit.id} flex={1} overflowY="auto">
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4}>
            <FormLabel width="100%">
              {t(`Warp Factor Count`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={warpEngines?.warpFactorCount}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const count = parseInt(e.target.value, 10);
                  if (!isNaN(count)) {
                    setWarpFactorCount({
                      variables: {
                        pluginId,
                        outfitId: outfit.id,
                        shipId: null,
                        count,
                      },
                    });
                  }
                }}
              />
            </FormLabel>
            <FormHelperText id="email-helper-text">
              {t(
                `The number of warp factors including the minimum speed and cruising speed. Emergency and Destructive warp will be added automatically.`
              )}
            </FormHelperText>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

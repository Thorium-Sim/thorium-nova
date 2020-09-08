import {Box, Flex, Heading, Select} from "@chakra-ui/core";
import SearchableList from "../../ui/SearchableList";
import {
  useOutfitAbilitiesQuery,
  usePluginOutfitsSubscription,
  usePluginAddOutfitMutation,
  OutfitAbilities,
} from "../../../generated/graphql";
import React from "react";
import {useTranslation} from "react-i18next";
import {capitalCase} from "change-case";
import {useParams} from "react-router";

const NewOutfitDropdown = () => {
  const {t} = useTranslation();
  const {pluginId} = useParams();
  const {data} = useOutfitAbilitiesQuery();
  const [add] = usePluginAddOutfitMutation();
  return (
    <Select
      value="nothing"
      onChange={e => {
        if (e.target.value !== "nothing") {
          add({
            variables: {pluginId, ability: e.target.value as OutfitAbilities},
          });
        }
      }}
    >
      <option value="nothing">{t(`New Outfit`)}</option>
      {data?.outfitAbilities?.enumValues?.map(value => (
        <option key={value.name} value={value.name}>
          {capitalCase(value.name)}
        </option>
      ))}
    </Select>
  );
};
const OutfitsConfig: React.FC = () => {
  const {t} = useTranslation();
  const {pluginId} = useParams();
  const {data} = usePluginOutfitsSubscription({variables: {pluginId}});
  return (
    <Box p={8}>
      <Heading>{t(`Outfits`)}</Heading>
      <Flex>
        <Flex direction="column">
          <SearchableList
            items={
              data?.pluginOutfits.map(o => ({
                id: o.id,
                name: o.identity.name,
                outfitType: o.isOutfit.outfitType,
              })) || []
            }
          />
          <NewOutfitDropdown />
        </Flex>
      </Flex>
    </Box>
  );
};

export default OutfitsConfig;

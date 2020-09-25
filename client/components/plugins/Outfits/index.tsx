import {Box, Flex, Grid, Heading, IconButton, Select} from "@chakra-ui/core";
import SearchableList from "../../ui/SearchableList";
import {
  useOutfitAbilitiesQuery,
  usePluginOutfitsSubscription,
  usePluginAddOutfitMutation,
  OutfitAbilities,
  usePluginOutfitRemoveMutation,
} from "../../../generated/graphql";
import React from "react";
import {useTranslation} from "react-i18next";
import {capitalCase} from "change-case";
import {
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
  useParams,
} from "react-router";
import Menubar from "./Menubar";
import SettingList from "./SettingList";
import {useConfirm} from "../../../components/Dialog";

const NewOutfitDropdown: React.FC<{onAdd: (id: string) => void}> = ({
  onAdd,
}) => {
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
          }).then(res => {
            if (res.data?.pluginAddOutfit.id) {
              onAdd(res.data?.pluginAddOutfit.id);
            }
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

const OutfitsList: React.FC = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const {pluginId} = useParams();
  const match = useMatch("/edit/:pluginId/outfits/:outfitId/*");
  const {outfitId} = match?.params || {};
  const {data} = usePluginOutfitsSubscription({variables: {pluginId}});
  const [remove] = usePluginOutfitRemoveMutation();

  const confirm = useConfirm();

  return (
    <Flex p={8} py={12} height="100%" direction="column" bg="blackAlpha.500">
      <Menubar />
      <Heading>{t(`Outfits`)}</Heading>
      <Grid flex={1} templateColumns="1fr 1fr 2fr" gap={6}>
        <Flex direction="column">
          <Box flex={1}>
            <SearchableList
              selectedItem={outfitId}
              setSelectedItem={item => navigate(`${item}/basic`)}
              items={
                data?.pluginOutfits.map(o => ({
                  id: o.id,
                  label: o.identity.name,
                  category: o.isOutfit.outfitType,
                })) || []
              }
              renderItem={c => (
                <Flex key={c.id} alignItems="center">
                  <Box flex={1}>{c.label}</Box>
                  <IconButton
                    icon="small-close"
                    size="sm"
                    aria-label={t("Remove Outfit")}
                    variantColor="danger"
                    onClick={async e => {
                      e.preventDefault();
                      if (
                        await confirm({
                          header: `Are you sure you want to delete ${c.label}?`,
                          body:
                            "This will also remove it from any ships that use it.",
                        })
                      ) {
                        remove({variables: {pluginId, outfitId: c.id}});
                        navigate(`/edit/${pluginId}/outfits`);
                      }
                    }}
                  ></IconButton>
                </Flex>
              )}
            />
          </Box>
          <NewOutfitDropdown onAdd={id => navigate(`${id}/basic`)} />
        </Flex>
        <Outlet />
      </Grid>
    </Flex>
  );
};

const OutfitsConfig = () => {
  return (
    <Routes>
      <Route path="/" element={<OutfitsList></OutfitsList>}>
        <Route path=":outfitId/*" element={<SettingList />} />
      </Route>
    </Routes>
  );
};
export default OutfitsConfig;

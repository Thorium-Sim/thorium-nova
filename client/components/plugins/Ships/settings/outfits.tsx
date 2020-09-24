import {Box, Button, Flex, Grid, Heading, IconButton} from "@chakra-ui/core";
import SearchableList from "../../../../components/ui/SearchableList";
import React from "react";
import {useTranslation} from "react-i18next";
import {useParams} from "react-router";
import {
  useAllPluginOutfitsQuery,
  usePluginShipOutfitsSubscription,
  usePluginShipAddOutfitMutation,
  usePluginShipRemoveOutfitMutation,
} from "../../../../generated/graphql";
import {css} from "@emotion/core";

const ShipOutfits: React.FC = () => {
  const {t} = useTranslation();
  const {pluginId, shipId} = useParams();
  const {data: outfitData} = useAllPluginOutfitsQuery({
    fetchPolicy: "cache-and-network",
  });
  const {data: shipData} = usePluginShipOutfitsSubscription({
    variables: {pluginId, shipId},
  });
  const [addOutfit] = usePluginShipAddOutfitMutation();
  const [removeOutfit] = usePluginShipRemoveOutfitMutation();

  const [allPlugins, setAllPlugins] = React.useState(false);

  const ship = shipData?.pluginShip;
  const outfits = outfitData?.allPluginOutfits;
  if (!ship || !outfits) return <div>Loading...</div>;
  const assignedOutfitTypes = ship.shipOutfits.outfits.map(
    o => o.isOutfit.outfitType
  );
  return (
    <Flex
      css={css`
        gap: 2rem;
      `}
      overflow="hidden"
    >
      <Flex direction="column" flex={1}>
        <Heading size="md" as="h3">
          {t(`Available Systems`)}
        </Heading>
        <SearchableList
          items={outfits
            .filter(o => (allPlugins ? true : o.pluginId === pluginId))
            .map(o => ({
              id: o.id,
              label: o.identity.name,
              category: o.isOutfit.outfitType,
              pluginName: o.pluginName,
            }))}
          renderItem={c => (
            <Flex key={c.id} alignItems="center">
              <Box flex={1}>
                <div>{c.label}</div>
                {allPlugins && (
                  <div>
                    <small>{c.pluginName}</small>
                  </div>
                )}
              </Box>
              <IconButton
                icon="small-add"
                size="sm"
                aria-label={t("Add System")}
                isDisabled={assignedOutfitTypes.includes(c.category)}
                onClick={() =>
                  addOutfit({variables: {pluginId, shipId, outfitId: c.id}})
                }
              ></IconButton>
            </Flex>
          )}
          searchKeys={["label", "category", "pluginName"]}
        ></SearchableList>
        {!allPlugins && (
          <Button onClick={() => setAllPlugins(true)}>
            {t("Include Other Plugins")}
          </Button>
        )}
        {allPlugins && (
          <Button onClick={() => setAllPlugins(false)}>
            {t("Exclude Other Plugins")}
          </Button>
        )}
      </Flex>
      <Flex direction="column" flex={1}>
        <Heading size="md" as="h3">
          {t(`Assigned Systems`)}
        </Heading>
        <SearchableList
          items={ship.shipOutfits.outfits.map(o => ({
            id: o.id,
            label: o.identity.name,
            category: o.isOutfit.outfitType,
          }))}
          renderItem={c => (
            <Flex key={c.id} alignItems="center">
              <Box flex={1}>
                <div>{c.label}</div>
              </Box>
              <IconButton
                icon="small-close"
                size="sm"
                aria-label={t("Remove System")}
                variantColor="danger"
                onClick={() =>
                  removeOutfit({variables: {pluginId, shipId, outfitId: c.id}})
                }
              ></IconButton>
            </Flex>
          )}
          searchKeys={["label", "category"]}
        ></SearchableList>
      </Flex>
    </Flex>
  );
};

export default ShipOutfits;

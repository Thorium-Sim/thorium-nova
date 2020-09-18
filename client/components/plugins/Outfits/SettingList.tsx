import React from "react";
import {Box} from "@chakra-ui/core";
import ListGroupItem from "../../../components/ui/ListGroupItem";
import {usePluginOutfitSubscription} from "../../../generated/graphql";
import {Route, Routes, useMatch, useParams} from "react-router";
import {pascalCase, capitalCase} from "change-case";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import OutfitBasic from "./settings/basic";
import {OutfitDefinition} from "./settings/outfitType";
import * as OutfitSettings from "./settings";

function settingsComponent(outfit: OutfitDefinition) {
  const outfitType = outfit.isOutfit.outfitType;
  const outfitName = `Outfit${pascalCase(
    outfitType
  )}` as keyof typeof OutfitSettings;
  const Comp = OutfitSettings[outfitName];
  if (!Comp) return null;
  return Comp;
}
const OutfitSpecificSettings: React.FC<{outfit: OutfitDefinition}> = ({
  outfit,
}) => {
  const Comp = settingsComponent(outfit);
  if (!Comp) return null;
  return <Comp outfit={outfit} />;
};

const SettingList: React.FC = props => {
  const {t} = useTranslation();
  const {pluginId, outfitId} = useParams();

  const {data} = usePluginOutfitSubscription({variables: {pluginId, outfitId}});
  const outfitType = data?.pluginOutfit?.isOutfit.outfitType;
  const match = useMatch("/edit/:pluginId/outfits/:outfitId/:setting");

  if (!data || !data.pluginOutfit || !outfitType) return null;
  const outfit = data.pluginOutfit;
  return (
    <>
      <Box>
        <ListGroupItem
          as={Link}
          to="basic"
          selected={match?.params.setting === "basic"}
        >
          {t("Basic")}
        </ListGroupItem>
        {settingsComponent(outfit) ? (
          <ListGroupItem
            as={Link}
            to="outfit"
            selected={match?.params.setting === "outfit"}
          >
            {capitalCase(outfitType)}
          </ListGroupItem>
        ) : null}
        {data.pluginOutfit?.power && (
          <ListGroupItem
            as={Link}
            to="power"
            selected={match?.params.setting === "power"}
          >
            {t("Power")}
          </ListGroupItem>
        )}
        {data.pluginOutfit?.damage && (
          <ListGroupItem
            as={Link}
            to="damage"
            selected={match?.params.setting === "damage"}
          >
            {t("Damage")}
          </ListGroupItem>
        )}
        {data.pluginOutfit?.heat && (
          <ListGroupItem
            as={Link}
            to="heat"
            selected={match?.params.setting === "heat"}
          >
            {t("Heat")}
          </ListGroupItem>
        )}
        {data.pluginOutfit?.efficiency && (
          <ListGroupItem
            as={Link}
            to="efficiency"
            selected={match?.params.setting === "efficiency"}
          >
            {t("Efficiency")}
          </ListGroupItem>
        )}
      </Box>
      <Routes>
        <Route path="basic" element={<OutfitBasic outfit={outfit} />}></Route>
        <Route path="power" element={<h1>Power</h1>}></Route>
        <Route path="damage" element={<h1>Damage</h1>}></Route>
        <Route path="heat" element={<h1>Heat</h1>}></Route>
        <Route path="efficiency" element={<h1>Efficiency</h1>}></Route>
        <Route
          path=":setting"
          element={<OutfitSpecificSettings outfit={outfit} />}
        ></Route>
      </Routes>
    </>
  );
};

export default SettingList;

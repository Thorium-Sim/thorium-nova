import React from "react";
import {Box} from "@chakra-ui/core";
import ListGroupItem from "../../../components/ui/ListGroupItem";
import {usePluginOutfitSubscription} from "../../../generated/graphql";
import {Route, Routes, useMatch, useParams} from "react-router";
import {capitalCase} from "change-case";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import OutfitBasic from "./settings/basic";

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
        <ListGroupItem
          as={Link}
          to="outfit"
          selected={match?.params.setting === "outfit"}
        >
          {capitalCase(outfitType)}
        </ListGroupItem>
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
        <Route path=":setting" element={<h1>Setting</h1>}></Route>
      </Routes>
    </>
  );
};

export default SettingList;

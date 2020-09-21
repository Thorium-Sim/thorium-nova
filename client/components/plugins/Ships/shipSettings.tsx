import React from "react";
import {Box} from "@chakra-ui/core";
import ListGroupItem from "../../../components/ui/ListGroupItem";
import {usePluginShipsSubscription} from "../../../generated/graphql";
import {Route, Routes, useMatch, useParams} from "react-router";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import OutfitBasic from "./settings/basic";

const SettingList: React.FC = props => {
  const {t} = useTranslation();
  const {pluginId, shipId} = useParams();

  const match = useMatch("/edit/:pluginId/ships/:shipId/:setting");

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
          to="assets"
          selected={match?.params.setting === "assets"}
        >
          {t("Assets")}
        </ListGroupItem>
        <ListGroupItem
          as={Link}
          to="outfits"
          selected={match?.params.setting === "outfits"}
        >
          {t("Outfits")}
        </ListGroupItem>
      </Box>
      <Routes>
        <Route path="basic" element={<h1>Ship</h1>}></Route>
        <Route path="assets" element={<h1>Ship</h1>}></Route>
        <Route path="outfits" element={<h1>Ship</h1>}></Route>
      </Routes>
    </>
  );
};

export default SettingList;

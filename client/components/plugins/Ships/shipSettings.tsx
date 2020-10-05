import React from "react";
import ListGroupItem from "../../../components/ui/ListGroupItem";
import {Route, Routes, useMatch} from "react-router";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import ShipBasic from "./settings/basic";
import ShipAssets from "../ShipAssets";
import ShipOutfits from "./settings/outfits";
import ShipPhysics from "./settings/physics";

const SettingList: React.FC = props => {
  const {t} = useTranslation();

  const match = useMatch("/edit/:pluginId/ships/:shipId/:setting");

  return (
    <>
      <div>
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
          to="physics"
          selected={match?.params.setting === "physics"}
        >
          {t("Physics")}
        </ListGroupItem>
        <ListGroupItem
          as={Link}
          to="outfits"
          selected={match?.params.setting === "outfits"}
        >
          {t("Outfits")}
        </ListGroupItem>
      </div>
      <Routes>
        <Route path="basic" element={<ShipBasic />}></Route>
        <Route path="assets" element={<ShipAssets />}></Route>
        <Route path="physics" element={<ShipPhysics />}></Route>
        <Route path="outfits" element={<ShipOutfits />}></Route>
      </Routes>
    </>
  );
};

export default SettingList;

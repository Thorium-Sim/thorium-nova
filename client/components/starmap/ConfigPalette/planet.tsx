import React from "react";
import {useTranslation} from "react-i18next";
import {useConfigStore} from "../configStore";
import {isPlanet} from "./utils";

const PlanetPalette: React.FC = () => {
  const {t} = useTranslation();
  const universeId = useConfigStore(store => store.universeId);
  const selectedObject = useConfigStore(store => store.selectedObject);

  if (!selectedObject || !isPlanet(selectedObject)) return null;
  return <></>;
};
export default PlanetPalette;

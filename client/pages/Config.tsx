import React from "react";
import sleep from "../helpers/sleep";
import {useTranslation} from "react-i18next";
import {FaStar, FaTools, FaRocket} from "react-icons/fa";
import {useNavigate, useParams} from "react-router";
import {NavLink} from "react-router-dom";
import ConfigLayout from "../components/ui/ConfigLayout";

const ConfigIcon: React.FC<{to: string}> = props => {
  return (
    <NavLink
      className="w-full h-64 shadow-inner rounded-lg transition-colors duration-300 bg-whiteAlpha-300 cursor-pointer hover:bg-whiteAlpha-500 flex justify-center items-center flex-col"
      {...props}
    ></NavLink>
  );
};

const Config = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const {pluginId} = useParams();
  React.useEffect(() => {
    setIsOpen(true);
  }, []);
  async function onClose() {
    setIsOpen(false);
    await sleep(250);
    navigate("..");
  }
  return (
    <ConfigLayout title={t(`Plugin Configuration`)}>
      <div className="p-8 grid grid-cols-3 grid-rows-3 gap-48 justify-center">
        <ConfigIcon to={`/edit/${pluginId}/starmap`}>
          <FaStar className="text-6xl mb-4" />
          <p className="font-bold text-2xl">{t("Universes")}</p>
        </ConfigIcon>
        <ConfigIcon to={`/edit/${pluginId}/ships`}>
          <FaRocket className="text-6xl mb-4" />
          <p className="font-bold text-2xl">{t("Ships")}</p>
        </ConfigIcon>
        <ConfigIcon to={`/edit/${pluginId}/outfits`}>
          <FaTools className="text-6xl mb-4" />
          <p className="font-bold text-2xl">{t("Outfits")}</p>
        </ConfigIcon>
      </div>
    </ConfigLayout>
  );
};

export default Config;

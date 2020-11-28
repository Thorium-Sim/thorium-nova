import {useTranslation} from "react-i18next";
import Menubar from "../Outfits/Menubar";

const ThemeConfig = () => {
  const {t} = useTranslation();

  return (
    <div className="flex p-8 py-12 h-full flex-col bg-blackAlpha-500 overflow-y-hidden">
      <Menubar backLink />
      <h1 className="font-bold text-3xl">{t(`Themes`)}</h1>
    </div>
  );
};

export default ThemeConfig;

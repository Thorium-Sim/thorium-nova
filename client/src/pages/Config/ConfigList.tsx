import React, {ReactNode} from "react";
import {
  FaStar,
  FaTools,
  FaRocket,
  FaPaintBrush,
  FaBoxOpen,
  FaCodeBranch,
} from "react-icons/fa";
import {NavLink, useParams} from "react-router-dom";
import {MdMessage} from "react-icons/md";
import Menubar, {useMenubar} from "@thorium/ui/Menubar";

const ConfigIcon: React.FC<{
  to: string;
  disabled?: boolean;
  children: ReactNode;
}> = props => {
  return (
    <NavLink
      aria-disabled={props.disabled}
      className={`h-64 w-64 shadow-inner rounded-lg transition-colors duration-300 ${
        props.disabled
          ? "text-gray-500 bg-black/30 cursor-not-allowed"
          : "bg-white/30 cursor-pointer hover:bg-white/50"
      }  flex justify-center items-center flex-col`}
      onClick={e => {
        if (props.disabled) {
          e.preventDefault();
        }
      }}
      {...props}
    ></NavLink>
  );
};

const ConfigList = () => {
  const {pluginId} = useParams();
  useMenubar({backTo: `/config/${pluginId}`});
  return (
    <div className="p-8 h-[calc(100%-2rem)] overflow-y-auto">
      <h1 className="font-bold text-white text-3xl mb-4">Plugin Aspects</h1>

      <div className="h-full flex flex-wrap gap-16 justify-center">
        <ConfigIcon to={`/config/${pluginId}/starmap`}>
          <FaStar className="text-6xl mb-4" />
          <p className="font-bold text-2xl">Universe</p>
        </ConfigIcon>
        <ConfigIcon to={`/config/${pluginId}/ships`}>
          <FaRocket className="text-6xl mb-4" />
          <p className="font-bold text-2xl">Ships</p>
        </ConfigIcon>
        <ConfigIcon to={`/config/${pluginId}/systems`}>
          <FaTools className="text-6xl mb-4" />
          <p className="font-bold text-2xl">Ship Systems</p>
        </ConfigIcon>
        <ConfigIcon to={`/config/${pluginId}/timelines`}>
          <FaCodeBranch className="text-6xl mb-4" />
          <p className="font-bold text-2xl">Timelines</p>
        </ConfigIcon>
        <ConfigIcon disabled to={`/config/${pluginId}/phrases`}>
          <MdMessage className="text-6xl mb-4" />
          <p className="font-bold text-2xl">Phrases</p>
        </ConfigIcon>
        <ConfigIcon to={`/config/${pluginId}/themes`}>
          <FaPaintBrush className="text-6xl mb-4" />
          <p className="font-bold text-2xl">Themes</p>
        </ConfigIcon>
        <ConfigIcon to={`/config/${pluginId}/inventory`}>
          <FaBoxOpen className="text-6xl mb-4" />
          <p className="font-bold text-2xl">Inventory</p>
        </ConfigIcon>
      </div>
    </div>
  );
};

export default ConfigList;

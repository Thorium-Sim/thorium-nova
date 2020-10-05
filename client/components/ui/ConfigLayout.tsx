import React from "react";
import Menubar from "../plugins/Outfits/Menubar";

const ConfigLayout: React.FC<{title: string}> = ({children, title}) => {
  return (
    <div className="p-8 py-12 h-full flex flex-col bg-blackAlpha-500">
      <Menubar />
      <h2 className="font-bold text-4xl">{title}</h2>
      {children}
    </div>
  );
};

export default ConfigLayout;

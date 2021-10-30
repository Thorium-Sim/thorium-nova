import {lazy} from "react";
import {Route, Routes} from "react-router-dom";

const PluginEdit = lazy(() => import("./PluginEdit"));
const ConfigList = lazy(() => import("./ConfigList"));
const ShipsConfig = lazy(() => import("./Ships"));

export default function ConfigRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PluginEdit />} />
      <Route path="/:pluginId" element={<PluginEdit />} />
      <Route path="/:pluginId/list" element={<ConfigList />} />
      <Route path="/:pluginId/ships/*" element={<ShipsConfig />} />
    </Routes>
  );
}

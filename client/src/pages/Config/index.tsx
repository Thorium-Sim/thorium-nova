import {lazy} from "react";
import {Route, Routes} from "react-router-dom";

const PluginEdit = lazy(() => import("./PluginEdit"));
const ConfigList = lazy(() => import("./ConfigList"));
const ShipsConfig = lazy(() => import("./Ships"));
const ThemesConfig = lazy(() => import("./Themes"));
const StarmapConfig = lazy(() => import("./Starmap"));

export default function ConfigRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PluginEdit />} />
      <Route path="/:pluginId" element={<PluginEdit />} />
      <Route path="/:pluginId/list" element={<ConfigList />} />
      <Route path="/:pluginId/ships/*" element={<ShipsConfig />} />
      <Route path="/:pluginId/themes/*" element={<ThemesConfig />} />
      <Route path="/:pluginId/starmap/*" element={<StarmapConfig />} />
    </Routes>
  );
}

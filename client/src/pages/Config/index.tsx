import {useNetRequest} from "client/src/context/useNetRequest";
import {lazy} from "react";
import {Navigate, Route, Routes} from "react-router-dom";

const PluginEdit = lazy(() => import("./PluginEdit"));
const ConfigList = lazy(() => import("./ConfigList"));
const ShipsConfig = lazy(() => import("./Ships"));
const ThemesConfig = lazy(() => import("./Themes"));
const StarmapConfig = lazy(() => import("./Starmap"));
const ShipSystemConfig = lazy(() => import("./ShipSystems"));

export default function ConfigRoutes() {
  const client = useNetRequest("client");

  if (!client.isHost) return <Navigate to="/" replace />;

  return (
    <Routes>
      <Route path="/" element={<PluginEdit />} />
      <Route path="/:pluginId" element={<PluginEdit />} />
      <Route path="/:pluginId/list" element={<ConfigList />} />
      <Route path="/:pluginId/ships/*" element={<ShipsConfig />} />
      <Route path="/:pluginId/themes/*" element={<ThemesConfig />} />
      <Route path="/:pluginId/starmap/*" element={<StarmapConfig />} />
      <Route path="/:pluginId/systems/*" element={<ShipSystemConfig />} />
    </Routes>
  );
}

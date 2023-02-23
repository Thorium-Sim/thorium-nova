import {q} from "@client/context/AppContext";
import {lazy, Suspense} from "react";
import {Navigate, Route, Routes} from "react-router-dom";

const PluginEdit = lazy(() => import("./PluginEdit"));
const ConfigList = lazy(() => import("./ConfigList"));
const ShipsConfig = lazy(() => import("./Ships"));
const ThemesConfig = lazy(() => import("./Themes"));
const StarmapConfig = lazy(() => import("./Starmap"));
const ShipSystemConfig = lazy(() => import("./ShipSystems"));
const InventoryConfig = lazy(() => import("./Inventory"));

export default function ConfigRoutes() {
  const [client] = q.client.get.useNetRequest();

  if (!client.isHost) return <Navigate to="/" replace />;

  return (
    <>
      <div className="z-10 relative h-full">
        <Suspense>
          <Routes>
            <Route path="/" element={<PluginEdit />} />
            <Route path="/:pluginId" element={<PluginEdit />} />
            <Route path="/:pluginId/list" element={<ConfigList />} />
            <Route path="/:pluginId/ships/*" element={<ShipsConfig />} />
            <Route path="/:pluginId/themes/*" element={<ThemesConfig />} />
            <Route path="/:pluginId/starmap/*" element={<StarmapConfig />} />
            <Route path="/:pluginId/systems/*" element={<ShipSystemConfig />} />
            <Route
              path="/:pluginId/inventory/*"
              element={<InventoryConfig />}
            />
          </Routes>
        </Suspense>
      </div>
      <div className="w-full h-full bg-black/60 fixed backdrop-filter backdrop-blur top-0 z-0"></div>
    </>
  );
}

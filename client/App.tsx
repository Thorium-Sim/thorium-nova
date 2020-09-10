import React from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import useEasterEgg from "./helpers/easterEgg";
import Layout from "./components/Layout";
import {useClientRegistration} from "./helpers/getClientId";
import ShipAssets from "./components/plugins/ShipAssets";
import Starmap from "./pages/starmap";
import NoMatch from "./pages/NotFound";
import Config from "./pages/Config";
import PluginList from "./components/plugins/pluginsList";
import OutfitsConfig from "./components/plugins/Outfits";

const Welcome = React.lazy(() => import("./pages/index"));
const Releases = React.lazy(() => import("./pages/Releases"));
const ThemeBuilder = React.lazy(() => import("./pages/theme"));

const ClientApp: React.FC = () => {
  useEasterEgg();
  useClientRegistration();
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="config/*" element={<Welcome />} />
        <Route path="releases" element={<Releases />} />
        <Route path="theme" element={<ThemeBuilder />} />
        <Route path="test" element={<ShipAssets onClose={() => {}} />} />
        <Route path="edit/*" element={<Navigate to="/config" replace />} />
        <Route path="edit/:universeId/starmap/*" element={<Starmap />} />
        <Route path="edit/:pluginId/outfits/*" element={<OutfitsConfig />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
      <Routes>
        <Route path="config/*" element={<PluginList />} />
        <Route path="config/:pluginId/*" element={<PluginList />} />
      </Routes>
    </Layout>
  );
};

export default ClientApp;

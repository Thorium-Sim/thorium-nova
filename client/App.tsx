import React from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import useEasterEgg from "./helpers/easterEgg";
import Layout from "./components/Layout";
import {useClientRegistration} from "./helpers/getClientId";
import ShipAssets from "./components/plugins/ShipAssets";
import NoMatch from "./pages/NotFound";
import Viewscreen from "./components/viewscreen";
import CustomFlight from "./components/flightConfig/customFlight";

const Welcome = React.lazy(() => import("./pages/index"));
const Releases = React.lazy(() => import("./pages/Releases"));
const ThemeBuilder = React.lazy(() => import("./pages/theme"));
const Starmap = React.lazy(() => import("./pages/starmap"));
const PluginList = React.lazy(() => import("./components/plugins/pluginsList"));
const OutfitsConfig = React.lazy(() => import("./components/plugins/Outfits"));
const ShipsConfig = React.lazy(() => import("./components/plugins/Ships"));
const Config = React.lazy(() => import("./pages/Config"));

const ClientApp: React.FC = () => {
  useEasterEgg();
  useClientRegistration();
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="releases" element={<Releases />} />
        <Route path="theme" element={<ThemeBuilder />} />
        <Route path="flight" element={<Viewscreen />} />
        <Route path="config/flight" element={<CustomFlight />} />
        <Route path="edit/:universeId/starmap/*" element={<Starmap />} />
        <Route path="edit/:pluginId/outfits/*" element={<OutfitsConfig />} />
        <Route path="edit/:pluginId/ships/*" element={<ShipsConfig />} />
        <Route path="config" element={<PluginList />} />
        <Route path="config/:pluginId" element={<PluginList />} />
        <Route path="config/:pluginId/edit" element={<Config />}></Route>
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </Layout>
  );
};

export default ClientApp;

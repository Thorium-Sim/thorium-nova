import React from "react";
import {Route, Routes} from "react-router-dom";
import useEasterEgg from "./helpers/easterEgg";
import Layout from "./components/Layout";
import {useClientRegistration} from "./helpers/getClientId";
import NoMatch from "./pages/NotFound";
import CustomFlight from "./components/flightConfig/customFlight";
import {ErrorBoundary} from "react-error-boundary";

const Welcome = React.lazy(() => import("./pages/index"));
const Releases = React.lazy(() => import("./pages/Releases"));
const ThemeBuilder = React.lazy(() => import("./pages/theme"));
const Starmap = React.lazy(() => import("./pages/starmap"));
const PluginList = React.lazy(() => import("./components/plugins/pluginsList"));
const OutfitsConfig = React.lazy(() => import("./components/plugins/Outfits"));
const ShipsConfig = React.lazy(() => import("./components/plugins/Ships"));
const PhrasesConfig = React.lazy(() => import("./components/plugins/Phrases"));
const ThemeConfig = React.lazy(() => import("./components/plugins/Themes"));
const Config = React.lazy(() => import("./pages/Config"));
const Viewscreen = React.lazy(() => import("./components/viewscreen"));
const StarmapCore = React.lazy(() => import("./components/core"));
const FlightLobby = React.lazy(() => import("./components/flightLobby"));
const ClientLobby = React.lazy(
  () => import("./components/clientLobby/ClientContext")
);

const MainApp: React.FC = () => {
  useEasterEgg();
  useClientRegistration();
  return (
    <Layout>
      <Routes>
        <Route path="/*" element={<Welcome />} />
        <Route path="releases" element={<Releases />} />
        <Route path="theme" element={<ThemeBuilder />} />
        <Route path="flight" element={<FlightLobby />} />
        <Route path="client" element={<ClientLobby />} />
        <Route path="flight/core" element={<StarmapCore />} />
        <Route path="flight/:shipId/viewscreen" element={<Viewscreen />} />
        <Route path="config/flight" element={<CustomFlight />} />
        <Route path="edit/:universeId/starmap/*" element={<Starmap />} />
        <Route path="edit/:pluginId/outfits/*" element={<OutfitsConfig />} />
        <Route path="edit/:pluginId/ships/*" element={<ShipsConfig />} />
        <Route path="edit/:pluginId/phrases/*" element={<PhrasesConfig />} />
        <Route path="edit/:pluginId/themes/*" element={<ThemeConfig />} />
        <Route path="config" element={<PluginList />} />
        <Route path="config/:pluginId" element={<PluginList />} />
        <Route path="config/:pluginId/edit" element={<Config />}></Route>
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </Layout>
  );
};

export default MainApp;

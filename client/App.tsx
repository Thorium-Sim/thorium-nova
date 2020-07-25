import React from "react";
import {Route, Routes} from "react-router-dom";
import useEasterEgg from "./helpers/easterEgg";
import Layout from "./components/Layout";
import {useClientRegistration} from "./helpers/getClientId";

const Welcome = React.lazy(() => import("./pages/index"));
const Releases = React.lazy(() => import("./pages/Releases"));

const NoMatch = () => {
  return <h2>Hey There!</h2>;
};

const ClientApp: React.FC = () => {
  useEasterEgg();
  useClientRegistration();
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="releases" element={<Releases />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </Layout>
  );
};

export default ClientApp;

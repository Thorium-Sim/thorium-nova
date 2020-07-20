import React from "react";
import {ErrorBoundary} from "react-error-boundary";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import {useClientId} from "./helpers/getClientId";
import useEasterEgg from "./helpers/easterEgg";
import {useStartFlightMutation} from "./generated/queryHooks";
import {css} from "@emotion/core";

const Releases = React.lazy(() => import("./components/Releases"));

const Fallback = () => {
  return <h1>Error</h1>;
};

const NoMatch = () => {
  return <Navigate to="/" />;
};

const ClientApp: React.FC = () => {
  const clientId = useClientId();
  const startFlight = useStartFlightMutation();
  useEasterEgg();

  const onReset = React.useCallback(() => {}, []);
  return (
    <Router>
      <React.Suspense fallback="Loading...">
        <ErrorBoundary FallbackComponent={Fallback} onReset={onReset}>
          <h1>How are you doing! Good!</h1>
          <h2>Client ID: {clientId}</h2>
          <button
            css={css`
              background-color: red;
            `}
            onClick={() => startFlight()}
          >
            Start Flight
          </button>
          <Routes>
            {/* <Route path="/" element={<Welcome />} /> */}
            <Route path="releases" element={<Releases />} />

            <Route path="*" element={<NoMatch />} />
          </Routes>
        </ErrorBoundary>
      </React.Suspense>
    </Router>
  );
};

export default ClientApp;

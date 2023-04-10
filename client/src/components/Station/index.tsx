import {Navigate} from "react-router-dom";
import {lazy, Suspense} from "react";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {q} from "@client/context/AppContext";
import {ErrorBoundary} from "react-error-boundary";

import FlightDirectorLayout from "../FlightDirector";
import StationLayout from "./StationLayout";
import Effects from "./Effects";

const StationWrapper = () => {
  const [client] = q.client.get.useNetRequest();
  const [station] = q.station.get.useNetRequest();
  // TODO November 29, 2021: Include sound player here
  // TODO November 29, 2021: Include some kind of alert toast notification thing here
  // The existing alerts won't be targeted by the theme, so we need to embed it here.
  if (!station) return <Navigate to="/" />;
  if (station.name === "Flight Director") return <FlightDirectorLayout />;
  return (
    <div className="bg-black absolute z-1 h-full w-full top-0 bottom-">
      {client.offlineState !== "blackout" && (
        <>
          <ErrorBoundary fallback={<p>Error</p>}>
            <Suspense fallback={null}>
              <Effects />
            </Suspense>
            <Suspense fallback={<LoadingSpinner />}>
              <StationLayout />
            </Suspense>
          </ErrorBoundary>
        </>
      )}
    </div>
  );
};

export default StationWrapper;

import * as React from "react";
import {ReactNode, StrictMode, Suspense} from "react";
import {AlertDialog} from "@thorium/ui/AlertDialog";
import useEasterEgg from "../hooks/useEasterEgg";
import {ErrorBoundary, FallbackProps} from "react-error-boundary";
import ToastContainer from "./ToastContext";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {IssueTrackerProvider} from "../components/IssueTracker";
import {getTabId} from "@thorium/tab-id";
import {
  createLiveQueryReact,
  LiveQueryProvider,
  useLiveQuery,
} from "@thorium/live-query/client";
import {AppRouter} from "@server/init/router";
import {ThoriumAccountContextProvider} from "./ThoriumAccountContext";
import {useSessionStorage} from "@client/hooks/useSessionStorage";
import {randomFromList} from "@server/utils/randomFromList";
import {Disconnected, Reconnecting} from "./ConnectionStatus";

const Fallback: React.FC<FallbackProps> = ({error}) => {
  return (
    <div className="p-4 text-white">
      <h1 className="text-5xl">Error</h1>
      <h2 className="text-3xl">{error?.message}</h2>
    </div>
  );
};

const backgrounds = [
  "/assets/backgrounds/background.jpg",
  "/assets/backgrounds/background2.jpg",
  "/assets/backgrounds/background3.jpg",
  "/assets/backgrounds/background4.jpg",
];

const Layout = ({children}: {children: ReactNode}) => {
  const [bg] = useSessionStorage("bg-otd", randomFromList(backgrounds));
  return (
    <div
      className="z-0 absolute top-0 bg-center bg-cover w-full h-full text-white"
      style={{
        backgroundImage: `linear-gradient(
  135deg,
  rgba(0, 0, 0, 1) 0%,
  rgba(0, 0, 0, 0) 40%,
  rgba(0, 0, 0, 0) 60%,
  rgba(0, 0, 0, 1) 100%
),
url(${bg})`,
      }}
    >
      {children}
    </div>
  );
};

async function getRequestContext() {
  return {id: await getTabId()};
}

function ConnectionStatus() {
  const {reconnectionState} = useLiveQuery();

  if (reconnectionState === "reconnecting") return <Reconnecting />;
  if (reconnectionState === "disconnected") return <Disconnected />;
  return null;
}

/**
 * A component to contain all of the context and wrapper components for the app.
 */
export default function AppContext({children}: {children: ReactNode}) {
  useEasterEgg();
  return (
    <StrictMode>
      <Layout>
        <ErrorBoundary FallbackComponent={Fallback}>
          <Suspense fallback={<LoadingSpinner />}>
            <LiveQueryProvider getRequestContext={getRequestContext}>
              <ConnectionStatus />
              <ErrorBoundary FallbackComponent={Fallback}>
                <Suspense fallback={<LoadingSpinner />}>
                  <ThoriumAccountContextProvider>
                    <AlertDialog>
                      <IssueTrackerProvider>{children}</IssueTrackerProvider>
                      <ToastContainer />
                    </AlertDialog>
                  </ThoriumAccountContextProvider>
                </Suspense>
              </ErrorBoundary>
            </LiveQueryProvider>
          </Suspense>
        </ErrorBoundary>
      </Layout>
    </StrictMode>
  );
}

export const q = createLiveQueryReact<AppRouter>({
  headers: async () => ({
    "client-id": await getTabId(),
  }),
});

import {type ReactNode, StrictMode} from "react";
import {AlertDialog} from "@thorium/ui/AlertDialog";
import useEasterEgg from "../hooks/useEasterEgg";
import ToastContainer from "./ToastContext";
import {IssueTrackerProvider} from "../components/IssueTracker";
import {
  createLiveQueryReact,
  LiveQueryProvider,
  useLiveQuery,
} from "@thorium/live-query/client";
import type {AppRouter} from "@server/init/router";
import {ThoriumAccountContextProvider} from "./ThoriumAccountContext";
import {Disconnected, Reconnecting} from "./ConnectionStatus";
import {TabIdCoordinator} from "browser-tab-id";
import {createRNG} from "@thorium/rng";

let tabId = "";
if (typeof window !== "undefined") {
  const tabCoordinator = new TabIdCoordinator();
  const rng = createRNG(tabCoordinator.tabId);
  tabId = rng.nextString();
}

function getRequestContext() {
  return {id: tabId};
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
      <LiveQueryProvider getRequestContext={getRequestContext}>
        <ConnectionStatus />
        <ThoriumAccountContextProvider>
          <AlertDialog>
            <IssueTrackerProvider>{children}</IssueTrackerProvider>
            <ToastContainer />
          </AlertDialog>
        </ThoriumAccountContextProvider>
      </LiveQueryProvider>
    </StrictMode>
  );
}

export const q = createLiveQueryReact<AppRouter>({
  headers: async () => ({
    "client-id": tabId,
  }),
});

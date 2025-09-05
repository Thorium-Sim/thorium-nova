import { createContext, type ReactNode, StrictMode, use } from "react";
import { AlertDialog } from "@thorium/ui/AlertDialog";
import useEasterEgg from "../hooks/useEasterEgg";
import ToastContainer from "./ToastContext";
import { IssueTrackerProvider } from "../components/IssueTracker";
import {
	createLiveQueryReact,
	LiveQueryProvider,
	useLiveQuery,
} from "@thorium/utils/live-query/client";
import type { AppRouter } from "@thorium/.server/init/router";
import { ThoriumAccountContextProvider } from "./ThoriumAccountContext";
import { Disconnected, Reconnecting } from "./ConnectionStatus";
import { TabIdCoordinator } from "browser-tab-id";
import { createRNG } from "@thorium/utils/rng";

export let clientId = "";
if (typeof window !== "undefined") {
	if (sessionStorage.getItem("test-clientId")) {
		clientId = sessionStorage.getItem("test-clientId") || "";
	} else {
		let browserId = localStorage.getItem("browserId");
		const tabCoordinator = new TabIdCoordinator();
		if (!browserId) {
			browserId = tabCoordinator.generateUUID();
			localStorage.setItem("browserId", browserId);
		}
		const rng = createRNG(`${browserId}${tabCoordinator.tabId}`);
		clientId = rng.nextString();
	}
}

function getRequestContext() {
	return { id: clientId };
}

function ConnectionStatus() {
	const { reconnectionState } = useLiveQuery();

	if (reconnectionState === "reconnecting") return <Reconnecting />;
	if (reconnectionState === "disconnected") return <Disconnected />;
	return null;
}

/**
 * A component to contain all of the context and wrapper components for the app.
 */
export default function AppContext({ children }: { children: ReactNode }) {
	useEasterEgg();
	return (
		<LiveQueryProvider getRequestContext={getRequestContext}>
			<ConnectionStatus />
			<ThoriumAccountContextProvider>
				<AlertDialog>
					<IssueTrackerProvider>{children}</IssueTrackerProvider>
					<ToastContainer />
				</AlertDialog>
			</ThoriumAccountContextProvider>
		</LiveQueryProvider>
	);
}

export const q = createLiveQueryReact<AppRouter>({
	headers: async () => ({
		"client-id": clientId,
	}),
});

import type { AppRouter } from "@thorium/.server/init/router";
import { AlertDialog } from "@thorium/ui/AlertDialog";
import {
	createLiveQueryReact,
	LiveQueryProvider,
	useLiveQuery,
} from "@thorium/utils/live-query/client";
import uniqid from "@thorium/utils/uniqid";
import { type ReactNode } from "react";

import { IssueTrackerProvider } from "../components/IssueTracker";
import useEasterEgg from "../hooks/useEasterEgg";
import { Disconnected, Reconnecting } from "./ConnectionStatus";
import { ThoriumAccountContextProvider } from "./ThoriumAccountContext";
import ToastContainer from "./ToastContext";

const PERSISTENT_ID_KEY = "thoriumNova_clientPersistentId";
const PING_TIMEOUT = 500;
export let clientId =
	typeof window !== "undefined"
		? sessionStorage.getItem("test-clientId") || sessionStorage.getItem(PERSISTENT_ID_KEY) || ""
		: "";

/**
 * This client ID implementation works as follows:
 * - If the clientId is already present in session storage, use it.
 * - Request all open tabs to let us know what their clientId is.
 * - After a timeout, pick one of the available clientIds, or create a new one and add it to the overall list
 */
const broadcastChannel = new BroadcastChannel("thorium_clientCount");
const claimedByOthers = new Set();
export async function initializeClient() {
	broadcastChannel.addEventListener("message", (event) => {
		if (event.data === "clientPing") {
			if (clientId) {
				broadcastChannel.postMessage(clientId);
			}
		} else {
			claimedByOthers.add(event.data);
		}
	});
	if (clientId) return clientId;

	broadcastChannel.postMessage("clientPing");
	await new Promise<void>((res) => setTimeout(() => res(), PING_TIMEOUT));
	const clientList = (localStorage.getItem(PERSISTENT_ID_KEY) || "").split(",").filter(Boolean);
	for (const client of clientList) {
		if (claimedByOthers.has(client)) continue;
		return setClient(client);
	}
	const id = uniqid("tab-");
	localStorage.setItem(PERSISTENT_ID_KEY, [...clientList, id].join(","));
	return setClient(id);
}

function setClient(id: string) {
	sessionStorage.setItem(PERSISTENT_ID_KEY, id);
	clientId = id;
	return id;
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

export const [q, liveQueryClient] = createLiveQueryReact<AppRouter>({
	headers: async () => ({
		"client-id": clientId,
	}),
});

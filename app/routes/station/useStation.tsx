import type { AppRouter } from "@thorium/.server/init/router";
import { q, clientId } from "@thorium/context/AppContext";
import type { inferTransformedProcedureOutput } from "@thorium/utils/live-query/.server/types";
import { createContext, use, type ReactNode } from "react";

export const StationContext = createContext<{
	client: inferTransformedProcedureOutput<AppRouter["client"]["get"]>;
	station: inferTransformedProcedureOutput<AppRouter["station"]["get"]>;
	shipId: number;
} | null>(null);

export function StationData({ children }: { children: ReactNode }) {
	const [client] = q.client.get.useNetRequest({ clientId });
	const [station] = q.station.get.useNetRequest({ clientId });
	return (
		<StationContext value={{ client, station, shipId: client.shipId! }}>
			{children}
		</StationContext>
	);
}

export function useStation() {
	const data = use(StationContext);
	if (!data)
		throw new Error("useStation must be used inside a station context");
	return data;
}

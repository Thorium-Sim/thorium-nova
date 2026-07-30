import { Navigate } from "@thorium/components/Navigate";
import { q, clientId } from "@thorium/context/AppContext";
import StationWrapper from "@thorium/routes/station";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { useEffect } from "react";

import type { Route } from "./+types/developmentCard";

export default function CardRenderer({ params }: Route.ComponentProps) {
	const [station] = q.station.get.useNetRequest({ clientId });
	const [flight] = q.flight.active.useNetRequest();
	useEffect(() => {
		void q.client.testStation.netSend({ component: params.cardId, clientId });
		return () => {
			void q.client.testStation.netSend({ component: null, clientId });
		};
	}, [params.cardId]);

	if (!flight) return <Navigate to="/" />;
	if (!station) return <LoadingSpinner />;
	return <StationWrapper />;
}

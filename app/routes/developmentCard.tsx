import { Navigate } from "@thorium/components/Navigate";
import { q, clientId } from "@thorium/context/AppContext";
import StationWrapper from "@thorium/routes/station";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { useEffect } from "react";
import { useParams } from "react-router";

export default function CardRenderer() {
	const { component } = useParams() as { component: string };
	const station = q.station.get.useNetRequest({ clientId });
	const flight = q.flight.active.useNetRequest();
	useEffect(() => {
		void q.client.testStation.netSend({ component, clientId });
		return () => {
			void q.client.testStation.netSend({ component: null, clientId });
		};
	}, [component]);
	if (!flight) return <Navigate to="/" />;
	if (!station) return <LoadingSpinner />;
	return <StationWrapper />;
}

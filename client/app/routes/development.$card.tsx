import { q } from "@client/context/AppContext";
import { LoadingSpinner } from "@thorium/ui/LoadingSpinner";
import { useEffect } from "react";
import { useParams } from "@remix-run/react";
import StationWrapper from "@client/routes/flight.station";
import { Navigate } from "@client/components/Navigate";

export default function CardRenderer() {
	const { component } = useParams() as { component: string };
	const station = q.station.get.useNetRequest();
	const flight = q.flight.active.useNetRequest();
	useEffect(() => {
		q.client.testStation.netSend({ component });
		return () => {
			q.client.testStation.netSend({ component: null });
		};
	}, [component]);
	if (!flight) return <Navigate to="/" />;
	if (!station) return <LoadingSpinner />;

	return <StationWrapper />;
}

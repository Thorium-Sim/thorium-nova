import { Navigate } from "@thorium/components/Navigate";
import { q, clientId } from "@thorium/context/AppContext";
import { Suspense } from "react";

export default function Flight() {
	return (
		<Suspense fallback={<Navigate to="/flight/lobby" />}>
			<SmartRedirect />
		</Suspense>
	);
}

function SmartRedirect() {
	const [client] = q.client.get.useNetRequest({ clientId });

	if (client.stationId === "Flight Director") {
		return <Navigate to="/flight/core" />;
	}
	if (client.shipId && client.stationId) {
		return <Navigate to="/flight/station" />;
	}
	return <Navigate to="/flight/lobby" />;
}

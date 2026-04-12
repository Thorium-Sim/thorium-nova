import { redirect } from "react-router";
import { q, clientId } from "@thorium/context/AppContext";

export async function clientLoader() {
	const client = await q.client.get.netRequest({ clientId });

	if (client.stationId === "Flight Director") {
		throw redirect("/flight/core");
	}
	if (client.shipId && client.stationId) {
		throw redirect("/flight/station");
	}
	throw redirect("/flight/lobby");
}

export default function Flight() {
	return null;
}

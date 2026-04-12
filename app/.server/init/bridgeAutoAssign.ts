import type { DataContext } from "@thorium/.server/DataContext";

/** Claim a pre-generated bridge flightClient entity for a connecting client. Returns true if claimed. Callers are responsible for publishing. */
export function claimBridgeFlightClient(
	ctx: DataContext,
	clientId: string,
): boolean {
	if (!ctx.flight) return false;
	const client = ctx.server.clients[clientId];
	if (!client) return false;
	const clientName = client.name.toLowerCase();

	for (const entity of ctx.flight.ecs.componentCache.get("flightClient") ||
		[]) {
		const fc = entity.components.flightClient;
		if (
			!fc ||
			!fc.bridgeAssigned ||
			fc.clientId !== "" ||
			fc.expectedClientName.toLowerCase() !== clientName
		)
			continue;
		entity.updateComponent("flightClient", { clientId });
		ctx.flight.flightClientIndex.set(clientId, entity.id);
		return true;
	}
	return false;
}

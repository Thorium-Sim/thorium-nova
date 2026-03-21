import type { DataContext } from "@thorium/.server/DataContext";
import { pubsub } from "@thorium/.server/init/pubsub";

export function tryBridgeAutoAssign(ctx: DataContext, clientId: string): void {
	if (!ctx.flight) return;

	const client = ctx.server.clients[clientId];
	if (!client) return;

	const clientName = client.name;

	// Find all ship entities with a shipBridge component
	const shipsWithBridge = Array.from(
		ctx.flight.ecs.componentCache.get("shipBridge") || [],
	).filter((e) => e.components.isShip);

	// Count player ships
	const playerShipCache = ctx.flight.ecs.componentCache.get("isPlayerShip");
	const playerShipCount = playerShipCache ? playerShipCache.size : 0;

	const activePlugins = ctx.server.plugins.filter((p) => p.active);

	for (const ship of shipsWithBridge) {
		const bridge = ship.components.shipBridge;
		if (!bridge) continue;

		// Look up bridge config from plugins
		const bridgeConfig = activePlugins.reduce(
			(acc: any, plugin) => {
				if (acc || plugin.id !== bridge.pluginId) return acc;
				return (
					plugin.aspects.bridges.find(
						(b) => b.name === bridge.bridgeId,
					) || null
				);
			},
			null,
		);
		if (!bridgeConfig) continue;

		const shipName = ship.components.identity?.name || "";

		for (const level of bridgeConfig.levels) {
			for (const element of level.elements) {
				if (!element.clientName) continue;

				let assignStationId: string | undefined;

				if (element.type === "station" && element.stationName) {
					assignStationId = element.stationName;
				} else if (element.type === "viewscreen" && element.viewscreenId) {
					const viewscreen = bridgeConfig.viewscreens?.find(
						(v: any) => v.id === element.viewscreenId,
					);
					if (viewscreen?.name) {
						assignStationId = viewscreen.name;
					}
				}

				if (!assignStationId) continue;

				// Compute expected client name
				const expectedName =
					playerShipCount > 1
						? `${shipName}-${element.clientName}`
						: element.clientName;

				// Case-insensitive match
				if (clientName.toLowerCase() !== expectedName.toLowerCase()) continue;

				// Verify the station exists on this ship's stationComplement
				const stations = ship.components.stationComplement?.stations || [];
				const stationExists = stations.some(
					(s) => s.name === assignStationId,
				);
				if (!stationExists) continue;

				// Evict any non-bridge-assigned client currently at this station
				for (const entity of ctx.flight.ecs.componentCache.get(
					"flightClient",
				) || []) {
					const fc = entity.components.flightClient;
					if (
						fc &&
						fc.shipId === ship.id &&
						fc.stationId === assignStationId &&
						!fc.bridgeAssigned
					) {
						entity.updateComponent("flightClient", {
							shipId: null,
							stationId: null,
						});
					}
				}

				// Assign the matching client
				const flightClient = ctx.getFlightClient(clientId);
				if (flightClient) {
					flightClient.updateComponent("flightClient", {
						shipId: ship.id,
						stationId: assignStationId,
						bridgeAssigned: true,
					});
				}

				// Publish updates
				pubsub.publish.client.all();
				pubsub.publish.client.get({ clientId });
				pubsub.publish.station.get({ clientId });
				pubsub.publish.theme.get({ clientId });
				pubsub.publish.ship.get({ clientId });

				return; // First match wins
			}
		}
	}
}

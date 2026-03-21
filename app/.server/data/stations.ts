import type StationComplementPlugin from "@thorium/.server/classes/Plugins/StationComplement";
import type Station from "@thorium/.server/classes/Station";
import { staticStations } from "@thorium/.server/classes/Station";
import { t } from "@thorium/.server/init/t";
import z from "zod";
export const station = t.router({
	get: t.procedure
		.input(z.object({ clientId: z.string() }))
		.filter((publish: { clientId: string }, { input }) => {
			if (publish && publish.clientId !== input.clientId) return false;
			return true;
		})
		.autoPublish(["flightClient"], (entity) => {
			if (entity.components.flightClient) {
				return { clientId: entity.components.flightClient.clientId };
			}
		})
		.request(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId)?.components
				.flightClient;
			const ship = ctx.getPlayerShip(input.clientId);
			if (flightClient?.stationOverride) return flightClient.stationOverride;
			const complementStations = ship?.components.stationComplement?.stations || [];
			const hasViewscreenStations = complementStations.some(
				(s) => s.cards.some((c) => c.component === "Viewscreen"),
			);
			const filteredStatic = hasViewscreenStations
				? staticStations.filter((s) => s.name !== "Viewscreen")
				: staticStations;
			const station = filteredStatic
				.concat(complementStations)
				.find((s) => s.name === flightClient?.stationId) as unknown as Station;
			return station || null;
		}),
	available: t.procedure
		.autoPublish([], () => null)
		.request(({ ctx }) => {
			return ctx.server.plugins
				.reduce((stations: StationComplementPlugin[], plugin) => {
					if (!plugin.active) return stations;
					return stations.concat(plugin.aspects.stationComplements);
				}, [])
				.map((station) => ({
					name: station.name,
					pluginName: station.pluginName,
					stationCount: station.stationCount,
					hasShipMap: station.hasShipMap,
				}));
		}),
});

import { t } from "@thorium/.server/init/t";

export const loginCore = t.router({
	clients: t.procedure
		.autoPublish(["flightClient"], () => null)
		.request(({ ctx }) => {
			if (!ctx.flight) return [];
			const serverClients = Object.values(ctx.server.clients);
			const clients = serverClients
				.map((client) => {
					const flightClient = ctx.getFlightClient(client.id)?.components.flightClient;
					return { ...flightClient, name: client.name };
				})
				.filter((client) => client.stationId);
			return clients;
		}),
});

import Station, { staticStations } from "@thorium/.server/classes/Station";
import { pubsub } from "@thorium/.server/init/pubsub";
import { t } from "@thorium/.server/init/t";
import { z } from "zod";

export const client = t.router({
	get: t.procedure
		.input(z.object({ clientId: z.string() }))
		.filter((publish: { clientId: string } | null, { input }) => {
			if (!publish) return true;
			if (publish.clientId === input.clientId) return true;
			return false;
		})
		.request(({ ctx, input }) => {
			const { id, name, connected, isHost } =
				ctx.server.clients[input.clientId];
			const {
				officersLog,
				id: _id,
				...flightClient
			} = ctx.getFlightClient(input.clientId) || {};
			return { id, name, connected, isHost, ...flightClient };
		}),
	all: t.procedure.request(({ ctx }) => {
		const serverClients = Object.values(ctx.server.clients);
		const flightClients = ctx.flight?.clients || {};
		const clients = serverClients
			.map((client) => {
				const flightClient = flightClients[client.id];
				return {
					name: client.name,
					connected: client.connected,
					...flightClient?.toJSON(),
				};
			})
			.filter((client) => client.connected);
		return clients;
	}),
	setName: t.procedure
		.input(z.object({ clientId: z.string(), name: z.string().min(2) }))
		.send(({ ctx, input }) => {
			const client = ctx.getClient(input.clientId);
			client.name = input.name;
			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId: client.id });

			return { clientId: client.id, name: client.name };
		}),
	setStation: t.procedure
		.input(
			z.union([
				z.object({
					shipId: z.number(),
					stationId: z.string(),
					clientId: z.string(),
				}),
				z.object({ shipId: z.null(), clientId: z.string() }),
			]),
		)
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			// Only hosts can change other client's station assignment
			if (!ctx.getIsHost(ctx.clientId) && input.clientId !== ctx.clientId) {
				throw new Error(
					"You must be host to change other client's assignments.",
				);
			}
			if (!flightClient) {
				throw new Error("No flight has been started.");
			}

			// If shipId is null, we're removing ourselves from the flight.
			if (input.shipId === null) {
				flightClient.stationId = null;
				flightClient.shipId = null;

				pubsub.publish.client.all();
				pubsub.publish.client.get({ clientId: flightClient.id });
				pubsub.publish.station.get({ clientId: flightClient.id });
				pubsub.publish.theme.get({ clientId: flightClient.id });
				pubsub.publish.ship.get({ clientId: flightClient.id });
				return flightClient;
			}
			const ship = ctx.flight?.ships.find((ship) => ship.id === input.shipId);
			if (!ship) {
				throw new Error("No ship with that ID exists.");
			}
			const station = staticStations
				.concat(ship.components.stationComplement?.stations || [])
				.find((station) => station.name === input.stationId);

			if (!station) {
				throw new Error("No station with that ID exists.");
			}
			flightClient.stationId = input.stationId;
			flightClient.shipId = input.shipId;
			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId: flightClient.id });
			pubsub.publish.station.get({ clientId: flightClient.id });
			pubsub.publish.theme.get({ clientId: flightClient.id });
			pubsub.publish.ship.get({ clientId: flightClient.id });
			return flightClient;
		}),
	login: t.procedure
		.input(z.object({ clientId: z.string(), name: z.string() }))
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (flightClient) {
				flightClient.loginName = input.name;
				pubsub.publish.client.all();
				pubsub.publish.client.get({ clientId: input.clientId });
			}
		}),
	logout: t.procedure
		.input(z.object({ clientId: z.string() }))
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (flightClient) {
				flightClient.loginName = "";
				pubsub.publish.client.all();
				pubsub.publish.client.get({ clientId: input.clientId });
			}
		}),
	testStation: t.procedure
		.input(z.object({ clientId: z.string(), component: z.string().nullable() }))
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (!flightClient || !ctx.flight) {
				throw new Error("No flight has been started.");
			}
			const component = input.component;
			if (component) {
				const station = new Station({
					name: "Test Station",
					cards: [
						{
							name: component,
							component,
						},
					],
				});
				flightClient.stationOverride = station;
				flightClient.shipId = ctx.flight.playerShips[0].id;
				pubsub.publish.ship.get({ shipId: flightClient.shipId });
				flightClient.loginName = "Test User";
			} else {
				flightClient.stationOverride = null;
				flightClient.shipId = null;
				flightClient.loginName = "";
			}
			pubsub.publish.client.get({ clientId: input.clientId });
			pubsub.publish.station.get({ clientId: input.clientId });
			pubsub.publish.theme.get({ clientId: input.clientId });
		}),
});

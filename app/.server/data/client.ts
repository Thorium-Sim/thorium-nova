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
		.autoPublish(["flightClient"], (entity) =>
			entity.components.flightClient
				? { clientId: entity.components.flightClient?.clientId }
				: null,
		)
		.request(({ ctx, input }) => {
			const { id, name, connected, isHost } =
				ctx.server.clients[input.clientId];
			const {
				officersLog,
				clientId: _id,
				...flightClient
			} = ctx.getFlightClient(input.clientId)?.components.flightClient || {};
			return { id, name, connected, isHost, ...flightClient };
		}),
	all: t.procedure
		.autoPublish(["flightClient"], () => null)
		.request(({ ctx }) => {
			const serverClients = Object.values(ctx.server.clients);
			const clients = serverClients
				.map((client) => {
					const flightClient = ctx.getFlightClient(client.id);
					return {
						name: client.name,
						connected: client.connected,
						...flightClient?.components.flightClient!,
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
				flightClient.updateComponent("flightClient", {
					stationId: null,
					shipId: null,
				});
				const clientId = flightClient.components.flightClient!.clientId;
				pubsub.publish.client.all();
				pubsub.publish.client.get({ clientId });
				pubsub.publish.station.get({ clientId });
				pubsub.publish.theme.get({ clientId });
				pubsub.publish.ship.get({ clientId });
				return flightClient;
			}
			const ship = ctx.ecs.getEntityById(input.shipId);
			if (!ship?.components.isShip) {
				throw new Error("No ship with that ID exists.");
			}
			const station = staticStations
				.concat(ship.components.stationComplement?.stations || [])
				.find((station) => station.name === input.stationId);

			if (!station) {
				throw new Error("No station with that ID exists.");
			}

			flightClient.updateComponent("flightClient", {
				stationId: input.stationId,
				shipId: input.shipId,
			});

			const clientId = flightClient.components.flightClient!.clientId;

			pubsub.publish.client.all();
			pubsub.publish.client.get({ clientId });
			pubsub.publish.station.get({ clientId });
			pubsub.publish.theme.get({ clientId });
			pubsub.publish.ship.get({ clientId });
			return flightClient;
		}),
	login: t.procedure
		.input(z.object({ clientId: z.string(), name: z.string() }))
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (flightClient) {
				flightClient.updateComponent("flightClient", {
					loginName: input.name,
				});

				pubsub.publish.client.all();
				pubsub.publish.client.get({ clientId: input.clientId });
			}
		}),
	logout: t.procedure
		.input(z.object({ clientId: z.string() }))
		.send(({ ctx, input }) => {
			const flightClient = ctx.getFlightClient(input.clientId);
			if (flightClient) {
				flightClient.updateComponent("flightClient", {
					loginName: "",
				});

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
				flightClient.updateComponent("flightClient", {
					stationOverride: {
						name: "Test Station",
						cards: [
							{
								name: component,
								component,
							},
						],
						widgets: [],
					},
					shipId: ctx.flight.playerShips[0].id,
					loginName: "Test User",
				});
				pubsub.publish.ship.get({ shipId: ctx.flight.playerShips[0].id });
			} else {
				flightClient.updateComponent("flightClient", {
					stationOverride: null,
					shipId: null,
					loginName: "",
				});
			}
			pubsub.publish.client.get({ clientId: input.clientId });
			pubsub.publish.station.get({ clientId: input.clientId });
			pubsub.publish.theme.get({ clientId: input.clientId });
		}),
});

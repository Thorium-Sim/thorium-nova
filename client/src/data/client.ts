import {FlightClient} from "@server/classes/FlightClient";
import Station, {staticStations} from "@server/classes/Station";
import {pubsub} from "@server/init/pubsub";
import {t} from "@server/init/t";
import {z} from "zod";

export const client = t.router({
  get: t.procedure
    .filter((publish: {clientId: string} | null, {ctx}) => {
      if (!publish) return true;
      if (publish.clientId === ctx.id) return true;
      return false;
    })
    .request(({ctx}) => {
      const {id, name, connected, isHost} = ctx.server.clients[ctx.id];
      const {officersLog, id: _id, ...flightClient} = ctx.flightClient || {};
      return {id, name, connected, isHost, ...flightClient};
    }),
  all: t.procedure.request(({ctx}) => {
    const serverClients = Object.values(ctx.server.clients);
    const flightClients = ctx.flight?.clients || {};
    const clients = serverClients
      .map(client => {
        const flightClient = flightClients[client.id];
        return {
          name: client.name,
          connected: client.connected,
          ...flightClient?.toJSON(),
        };
      })
      .filter(client => client.connected);
    return clients;
  }),
  setName: t.procedure
    .input(z.object({name: z.string().min(2)}))
    .send(({ctx, input}) => {
      ctx.client.name = input.name;
      pubsub.publish.client.all();
      pubsub.publish.client.get({clientId: ctx.id});

      return {clientId: ctx.id, name: ctx.client.name};
    }),
  setStation: t.procedure
    .input(
      z.union([
        z.object({
          shipId: z.number(),
          stationId: z.string(),
          clientId: z.string().optional(),
        }),
        z.object({shipId: z.null(), clientId: z.string().optional()}),
      ])
    )
    .send(({ctx, input}) => {
      let flightClient: FlightClient | null = ctx.flightClient;
      if (input.clientId) {
        // Only hosts can change other client's station assignment
        if (!ctx.isHost || !input.clientId) {
          throw new Error(
            "You must be host to change other client's assignments."
          );
        }
        flightClient = ctx.findFlightClient(input.clientId);
      }
      if (!flightClient) {
        throw new Error("No flight has been started.");
      }

      // If shipId is null, we're removing ourselves from the flight.
      if (input.shipId === null) {
        flightClient.stationId = null;
        flightClient.shipId = null;

        pubsub.publish.client.all();
        pubsub.publish.client.get({clientId: flightClient.id});
        pubsub.publish.station.get({clientId: flightClient.id});
        pubsub.publish.theme.get({clientId: flightClient.id});
        pubsub.publish.ship.get({clientId: flightClient.id});
        return flightClient;
      }
      const ship = ctx.flight?.ships.find(ship => ship.id === input.shipId);
      if (!ship) {
        throw new Error("No ship with that ID exists.");
      }
      const station = staticStations
        .concat(ship.components.stationComplement?.stations || [])
        .find(station => station.name === input.stationId);

      if (!station) {
        throw new Error("No station with that ID exists.");
      }
      flightClient.stationId = input.stationId;
      flightClient.shipId = input.shipId;
      pubsub.publish.client.all();
      pubsub.publish.client.get({clientId: flightClient.id});
      pubsub.publish.station.get({clientId: flightClient.id});
      pubsub.publish.theme.get({clientId: flightClient.id});
      pubsub.publish.ship.get({clientId: flightClient.id});
      return flightClient;
    }),
  login: t.procedure
    .input(z.object({name: z.string()}))
    .send(({ctx, input}) => {
      if (ctx.flightClient) {
        ctx.flightClient.loginName = input.name;
        pubsub.publish.client.all();
        pubsub.publish.client.get({clientId: ctx.id});
      }
    }),
  logout: t.procedure.send(({ctx}) => {
    if (ctx.flightClient) {
      ctx.flightClient.loginName = "";
      pubsub.publish.client.all();
      pubsub.publish.client.get({clientId: ctx.id});
    }
  }),
  testStation: t.procedure
    .input(z.object({component: z.string().nullable()}))
    .send(({ctx, input}) => {
      if (!ctx.flightClient || !ctx.flight) {
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
        ctx.flightClient.stationOverride = station;
        ctx.flightClient.shipId = ctx.flight.playerShips[0].id;
        pubsub.publish.ship.get({shipId: ctx.flightClient.shipId});
        ctx.flightClient.loginName = "Test User";
      } else {
        ctx.flightClient.stationOverride = null;
        ctx.flightClient.shipId = null;
        ctx.flightClient.loginName = "";
      }
      pubsub.publish.client.get({clientId: ctx.id});
      pubsub.publish.station.get({clientId: ctx.id});
      pubsub.publish.theme.get({clientId: ctx.id});
    }),
});

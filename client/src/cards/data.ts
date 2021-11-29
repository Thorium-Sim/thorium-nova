import {DataContext} from "server/src/utils/DataContext";
import fs from "fs/promises";
import {thoriumPath} from "server/src/utils/appPaths";
import type {FlightDataModel} from "server/src/classes/FlightDataModel";
import {Entity} from "server/src/utils/ecs";
import {parse} from "yaml";
import {getFlights} from "server/src/utils/getFlights";
// This file is used for any subscriptions which all clients
// make, regardless of what cards they have.
export const subscriptions = {
  client: (context: DataContext, params: {clientId: string}) => {
    if (params && params.clientId !== context.clientId) throw null;

    // TODO Aug 31, 2021 - Merge this data with the flight client data
    // or create a new subscription just for the flight client.
    const {id, name, connected} = context.server.clients[context.clientId];

    return {id, name, connected, ...context.flightClient};
  },
  flight(context: DataContext) {
    const flight = context.flight;
    if (!flight) return null;
    const {date, name, paused} = flight;
    return {date, name, paused};
  },
  flights: async (context: DataContext) => {
    return getFlights();
  },
  dots(context: DataContext) {
    return (
      context.flight?.ecs.entities
        .filter(e => e.components.position && e.components.velocity)
        .map(e => ({id: e.id, color: e.components.color?.color})) || []
    );
  },
};

export function dataStream(entity: Entity, context: DataContext): boolean {
  return !!(entity.components.position && entity.components.velocity);
}

import {DataContext} from "server/src/utils/DataContext";
import fs from "fs/promises";
import {thoriumPath} from "server/src/utils/appPaths";
import type {FlightDataModel} from "server/src/classes/FlightDataModel";
import {Entity} from "server/src/utils/ecs";
import {parse} from "yaml";
// This file is used for any subscriptions which all clients
// make, regardless of what cards they have.
export const subscriptions = {
  client: {
    filter: (params: {clientId: string}, context: DataContext) => {
      return context.clientId === params.clientId;
    },
    fetch: (context: DataContext) => {
      // TODO Aug 31, 2021 - Merge this data with the flight client data
      // or create a new subscription just for the flight client.
      const {id, name, connected} = context.server.clients[context.clientId];
      return {id, name, connected};
    },
  },
  flight: {
    fetch(context: DataContext) {
      const flight = context.flight;
      if (!flight) return null;
      const {id, date, name, paused} = flight;
      return {id, date, name, paused};
    },
  },
  flights: {
    async fetch(context: DataContext) {
      let files: string[];
      try {
        files = await fs.readdir(`${thoriumPath}/flights/`);
      } catch {
        await fs.mkdir(`${thoriumPath}/flights/`);
        files = [];
      }
      const flightFiles = files.filter(f => f.includes(".flight"));
      const flightData = await Promise.all(
        flightFiles.map(async flightName => {
          const raw = await fs.readFile(
            `${thoriumPath}/flights/${flightName}`,
            "utf-8"
          );
          const data = parse(raw);
          return {...data, date: new Date(data.date)} as FlightDataModel;
        })
      );
      return flightData;
    },
  },
  dots: {
    fetch(context: DataContext) {
      return (
        context.flight?.ecs.entities
          .filter(e => e.components.position && e.components.velocity)
          .map(e => ({id: e.id, color: e.components.color?.color})) || []
      );
    },
  },
};

export function dataStream(entity: Entity, context: DataContext): boolean {
  return !!(entity.components.position && entity.components.velocity);
}

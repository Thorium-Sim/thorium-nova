import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import {getFlights} from "server/src/utils/getFlights";
import type Station from "server/src/classes/Station";
import ThemePlugin from "server/src/classes/Plugins/Theme";
import type {FlightClient} from "server/src/classes/FlightClient";

// This file is used for any subscriptions which all clients
// make, regardless of what cards they have.
export const subscriptions = {
  client: (context: DataContext, params: {clientId: string}) => {
    if (params && params.clientId !== context.clientId) throw null;

    const {id, name, connected, isHost} =
      context.server.clients[context.clientId];
    const {
      officersLog,
      id: _id,
      ...flightClient
    } = (context.flightClient as FlightClient) || {};
    return {id, name, connected, isHost, ...flightClient};
  },
  flight(context: DataContext) {
    const flight = context.flight;
    if (!flight) return null;
    const {date, name, paused} = flight;
    return {date, name, paused};
  },
  ship(context: DataContext, params: {shipId: number} | {clientId: string}) {
    if (params) {
      if ("shipId" in params && params.shipId !== context.flightClient?.shipId)
        throw null;
      if ("clientId" in params && params.clientId !== context.clientId)
        throw null;
    }
    return context.ship?.toJSON() as Entity;
  },
  station(context: DataContext, params: {clientId: string}): Station {
    if (params && params.clientId !== context.clientId) throw null;
    if (context.flightClient?.stationOverride)
      return context.flightClient.stationOverride;
    const station = context.ship?.components.stationComplement?.stations.find(
      s => s.name === context.flightClient?.stationId
    ) as unknown as Station;
    return station || null;
  },
  theme(context: DataContext, params: {clientId: string}) {
    if (params && params.clientId !== context.clientId) throw null;
    const themeObj = context.server.plugins
      .filter(plugin => context.flight?.pluginIds.includes(plugin.id))
      .reduce((acc: null | ThemePlugin, plugin) => {
        if (acc) return acc;
        if (plugin.id !== context.ship?.components.theme?.pluginId) return acc;
        return (
          plugin.aspects.themes.find(
            t => t.name === context.ship?.components.theme?.themeId
          ) || null
        );
      }, null);
    return themeObj;
  },
};

export function dataStream(entity: Entity, context: DataContext): boolean {
  return true; //!!(entity.components.position && entity.components.velocity);
}

import {DataContext} from "server/src/utils/DataContext";
import {Entity} from "server/src/utils/ecs";
import type Station from "server/src/classes/Station";
import ThemePlugin from "server/src/classes/Plugins/Theme";
import type {FlightClient} from "server/src/classes/FlightClient";
import {staticStations} from "server/src/classes/Station";

// This file is used for any subscriptions which all clients
// make, regardless of what cards they have.
export const requests = {
  thorium: (context: DataContext) => {
    const hasHost = Object.values(context.server.clients).some(
      client => client.isHost && client.connected
    );
    return {
      hasHost,
    };
  },
  client: (
    context: DataContext,
    params: {},
    publishParams: {clientId: string}
  ) => {
    if (publishParams && publishParams.clientId !== context.clientId)
      throw null;

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
  ship(
    context: DataContext,
    params: {},
    publishParams: {shipId: number} | {clientId: string}
  ) {
    if (publishParams) {
      if (
        "shipId" in publishParams &&
        publishParams.shipId !== context.flightClient?.shipId
      )
        throw null;
      if (
        "clientId" in publishParams &&
        publishParams.clientId !== context.clientId
      )
        throw null;
    }
    return (context.ship?.toJSON() as Entity) || null;
  },
  station(
    context: DataContext,
    params: {},
    publishParams: {clientId: string}
  ): Station {
    if (publishParams && publishParams.clientId !== context.clientId)
      throw null;
    if (context.flightClient?.stationOverride)
      return context.flightClient.stationOverride;
    const station = staticStations
      .concat(context.ship?.components.stationComplement?.stations || [])
      .find(
        s => s.name === context.flightClient?.stationId
      ) as unknown as Station;
    return station || null;
  },
  theme(context: DataContext, params: {}, publishParams: {clientId: string}) {
    if (publishParams && publishParams.clientId !== context.clientId)
      throw null;
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

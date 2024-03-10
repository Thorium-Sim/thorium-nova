import type StationComplementPlugin from "@server/classes/Plugins/StationComplement";
import type Station from "@server/classes/Station";
import {staticStations} from "@server/classes/Station";
import {t} from "@server/init/t";

export const station = t.router({
  get: t.procedure
    .filter((publish: {clientId: string}, {ctx}) => {
      if (publish && publish.clientId !== ctx.id) return false;
      return true;
    })
    .request(({ctx}) => {
      if (ctx.flightClient?.stationOverride)
        return ctx.flightClient.stationOverride;
      const station = staticStations
        .concat(ctx.ship?.components.stationComplement?.stations || [])
        .find(
          s => s.name === ctx.flightClient?.stationId
        ) as unknown as Station;
      return station || null;
    }),
  available: t.procedure.request(({ctx}) => {
    return ctx.server.plugins
      .reduce((stations: StationComplementPlugin[], plugin) => {
        if (!plugin.active) return stations;
        return stations.concat(plugin.aspects.stationComplements);
      }, [])
      .map(station => ({
        name: station.name,
        pluginName: station.pluginName,
        stationCount: station.stationCount,
        hasShipMap: station.hasShipMap,
      }));
  }),
});

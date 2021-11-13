import StationComplementPlugin from "server/src/classes/Plugins/StationComplement";
import {DataContext} from "../../utils/DataContext";

export const pluginStationsRequest = {
  availableStationsList(dataContext: DataContext) {
    return dataContext.server.plugins
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
  },
};

import ShipPlugin from "server/src/classes/Plugins/Ship";
import {DataContext} from "server/src/utils/DataContext";
import {FlightStartingPoint} from "server/src/utils/types";
import {getPlugin} from "./utils";

export const pluginShipsRequest = {
  pluginShips(
    context: DataContext,
    params: {pluginId: string},
    publishParams: {pluginId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    return plugin.aspects.ships;
  },
  pluginShip(
    context: DataContext,
    params: {pluginId: string; shipId: string},
    publishParams: {pluginId: string; shipId: string} | null
  ) {
    if (publishParams && params.pluginId !== publishParams.pluginId) throw null;
    const plugin = getPlugin(context, params.pluginId);
    const ship = plugin.aspects.ships.find(ship => ship.name === params.shipId);
    if (!ship) throw null;
    return ship;
  },
  availableShips(context: DataContext) {
    return context.server.plugins
      .reduce((ships: ShipPlugin[], plugin) => {
        if (!plugin.active) return ships;
        // TODO November 13, 2021 - Filter out ships that don't have the necessary
        // components for being a player ship.
        return ships.concat(plugin.aspects.ships);
      }, [])
      .map(ship => ({
        name: ship.name,
        description: ship.description,
        vanityUrl: ship.assets.vanity,
        pluginName: ship.pluginName,
      }));
  },
  availableStartingPoints(context: DataContext) {
    return context.server.plugins.reduce(
      (points: FlightStartingPoint[], plugin) => {
        if (!plugin.active) return points;

        return points.concat(
          plugin.aspects.solarSystems.flatMap(solarSystem => {
            const planets = solarSystem.planets.map(planet => ({
              pluginId: plugin.id,
              solarSystemId: solarSystem.name,
              objectId: planet.name,
              type: "planet" as const,
            }));
            // TODO May 17, 2022 - Make permanent ships available as starting points.
            return planets;
          })
        );
      },
      []
    );
  },
};
